/**
 * OBS 预览生命周期 Hook
 *
 * 职责清晰拆分为三件事：
 *   1. 组件挂载        -> setupPreview（仅一次）
 *   2. 组件卸载        -> destroyPreview
 *   3. 容器宽/高变化   -> resizePreview（仅在尺寸真正变化时，用 rAF 合并）
 *
 * 返回需要绑定到预览容器的 ref。组件只负责渲染，不感知任何 OBS 细节。
 */
import { useEffect, useRef } from 'react'

interface PreviewBounds {
  x: number
  y: number
  width: number
  height: number
}

/** 读取元素相对视口的整数边界 */
function readBounds(el: HTMLElement): PreviewBounds {
  const rect = el.getBoundingClientRect()
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  }
}

export function usePreview<T extends HTMLElement = HTMLDivElement>(): React.RefObject<T | null> {
  const containerRef = useRef<T>(null)

  // 挂载创建 / 卸载销毁
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    window.api.obs
      .setupPreview(readBounds(el))
      .catch((err) => console.error('Failed to setup preview:', err))

    return () => {
      window.api.obs.destroyPreview().catch((err) => {
        console.error('Failed to destroy preview:', err)
      })
    }
  }, [])

  // 仅在容器宽/高变化时调整预览
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // 以挂载时的初始尺寸为基线，首次观测（初始尺寸）不触发 resize
    const initial = readBounds(el)
    let lastWidth = initial.width
    let lastHeight = initial.height
    let rafId: number | null = null

    const observer = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width)
      const h = Math.round(entries[0].contentRect.height)

      // 宽高均未变化则跳过
      if (w === lastWidth && h === lastHeight) return
      lastWidth = w
      lastHeight = h
      if (w === 0 || h === 0) return

      // 用 rAF 合并连续变化，每帧最多调用一次
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        rafId = null
        window.api.obs.resizePreview(readBounds(el)).catch((err) => {
          console.error('Failed to resize preview:', err)
        })
      })
    })

    observer.observe(el)

    return () => {
      observer.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  return containerRef
}
