/**
 * 预览区域组件
 *
 * 纯展示：OBS 直接渲染到此容器；预览的创建/调整/销毁由 usePreview 管理。
 * 额外捕获容器上的指针事件，透传到主进程（用于在预览里拖拽/缩放源）。
 *
 * 用 Pointer 事件 + setPointerCapture：按下后即使指针移出容器，move/up 仍持续派发到容器，
 * 保证「未松开则一直保持拖拽/缩放」。
 */
import { useEffect, useMemo, useRef } from 'react'
import { useAppSelector } from '@renderer/store/hooks'
import { usePreview } from '@renderer/hooks/usePreview'
import type { PreviewMouseEvent, PreviewMouseEventType } from '@renderer/types/obs'

function EmptyHint(): React.JSX.Element {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center space-y-2">
        <p className="text-base text-zinc-400">暂无预览</p>
        <p className="text-sm text-zinc-600">请添加摄像头或其他源</p>
      </div>
    </div>
  )
}

function toPayload(
  type: PreviewMouseEventType,
  event: React.MouseEvent | React.PointerEvent
): PreviewMouseEvent {
  // 用容器 rect 自算相对坐标，不依赖 nativeEvent.offset（其相对光标下子元素，易错位）
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    type,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    containerWidth: rect.width,
    containerHeight: rect.height,
    button: event.button,
    buttons: event.buttons,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey
  }
}

export function Preview(): React.JSX.Element {
  const hasSources = useAppSelector((state) => state.sources.sources.length > 0)
  const containerRef = usePreview<HTMLDivElement>()

  // 订阅主进程推送的光标样式（悬浮缩放手柄等），直接设到容器
  useEffect(() => {
    const unsubscribe = window.api.obs.onPreviewCursorChanged((cursor) => {
      if (containerRef.current) {
        containerRef.current.style.cursor = cursor
      }
    })
    return () => unsubscribe()
  }, [containerRef])

  // pointermove 高频，用 ref 保存节流状态：上一条还没送达时只保留最后一条坐标
  const moveThrottle = useRef<{ inFlight: boolean; last: PreviewMouseEvent | null }>({
    inFlight: false,
    last: null
  })

  /** 事件处理器只构建一次：本组件不依赖渲染期闭包变量，避免每次渲染重建。 */
  const handlers = useMemo(() => {
    function flushMove(): void {
      const state = moveThrottle.current
      if (!state.last) {
        state.inFlight = false
        return
      }
      const payload = state.last
      state.last = null
      window.api.obs.sendPreviewMouseEvent(payload)
      // 微任务节流：本帧只发一条，剩余的下次再发
      queueMicrotask(flushMove)
    }

    return {
      onPointerDown: (e: React.PointerEvent) => {
        // 捕获指针：移出容器也能持续收到 move/up，直到松开
        e.currentTarget.setPointerCapture(e.pointerId)
        window.api.obs.sendPreviewMouseEvent(toPayload('mousedown', e))
      },
      onPointerUp: (e: React.PointerEvent) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
        window.api.obs.sendPreviewMouseEvent(toPayload('mouseup', e))
      },
      onPointerLeave: (e: React.PointerEvent) =>
        window.api.obs.sendPreviewMouseEvent(toPayload('mouseleave', e)),
      onDoubleClick: (e: React.MouseEvent) =>
        window.api.obs.sendPreviewMouseEvent(toPayload('dblclick', e)),
      onPointerMove: (e: React.PointerEvent) => {
        const state = moveThrottle.current
        state.last = toPayload('mousemove', e)
        if (state.inFlight) return
        state.inFlight = true
        flushMove()
      },
      onWheel: (e: React.WheelEvent) =>
        window.api.obs.sendPreviewMouseEvent({
          ...toPayload('wheel', e),
          deltaX: e.deltaX,
          deltaY: e.deltaY
        })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full bg-black relative rounded-md overflow-hidden"
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerLeave={handlers.onPointerLeave}
      onPointerMove={handlers.onPointerMove}
      onDoubleClick={handlers.onDoubleClick}
      onWheel={handlers.onWheel}
    >
      {!hasSources && <EmptyHint />}
    </div>
  )
}
