/**
 * 预览区域组件
 * OBS 直接渲染到此区域
 */
import { useEffect, useRef, useCallback } from 'react'
import { useAppSelector } from '@renderer/store/hooks'

export function Preview(): React.JSX.Element {
  const sources = useAppSelector((state) => state.sources.sources)
  const previewRef = useRef<HTMLDivElement>(null)
  const isPreviewSetup = useRef(false)

  // 初始化预览
  const setupPreviewDisplay = useCallback(async () => {
    if (!previewRef.current || isPreviewSetup.current) return

    const rect = previewRef.current.getBoundingClientRect()
    const bounds = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }

    console.debug('Setting up preview with bounds:', bounds)

    try {
      const result = await window.api.obs.setPreview(bounds)
      if (result) {
        isPreviewSetup.current = true
        console.debug('Preview setup complete, height:', result.height)
      }
    } catch (error) {
      console.error('Failed to setup preview:', error)
    }
  }, [])

  // 调整预览大小
  const resizePreviewDisplay = useCallback(async () => {
    if (!previewRef.current || !isPreviewSetup.current) return

    const rect = previewRef.current.getBoundingClientRect()
    const bounds = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }

    console.debug('Resizing preview to bounds:', bounds)

    try {
      await window.api.obs.resizePreview(bounds)
    } catch (error) {
      console.error('Failed to resize preview:', error)
    }
  }, [])

  // 当有源时设置预览
  useEffect(() => {
    if (sources.length > 0 && !isPreviewSetup.current) {
      // 延迟一帧确保 DOM 已渲染
      requestAnimationFrame(() => {
        setupPreviewDisplay()
      })
    }
  }, [sources.length, setupPreviewDisplay])

  // 监听窗口大小变化
  useEffect(() => {
    if (!isPreviewSetup.current) return

    const handleResize = (): void => {
      resizePreviewDisplay()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [resizePreviewDisplay])

  // 组件卸载时销毁预览
  useEffect(() => {
    return () => {
      if (isPreviewSetup.current) {
        window.api.obs.destroyPreview().catch(console.error)
        isPreviewSetup.current = false
      }
    }
  }, [])

  return (
    <div ref={previewRef} className="h-full bg-black relative">
      {sources.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70">
          <div className="text-center">
            <p className="text-lg">暂无预览</p>
            <p className="text-sm text-white/50 mt-1">请添加摄像头或其他源</p>
          </div>
        </div>
      )}
    </div>
  )
}
