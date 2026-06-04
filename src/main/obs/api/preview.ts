/**
 * [api] 预览
 *
 * 预览生命周期由渲染进程驱动：
 *   - setupPreview: Preview 组件挂载时调用（只初始化一次）
 *   - resizePreview: 布局变化时调用
 *   - destroyPreview: Preview 组件卸载时调用
 */
import { preview } from '../module'

interface PreviewBounds {
  x: number
  y: number
  width: number
  height: number
}

/** 初始化预览显示（渲染进程 Preview 组件挂载时调用，只执行一次） */
export function setupPreview(bounds: PreviewBounds): { height: number } | null {
  return preview.init(bounds)
}

/** 调整预览显示的位置与尺寸 */
export function resizePreview(bounds: PreviewBounds): { height: number } {
  return preview.resize(bounds)
}

/** 销毁预览显示（渲染进程 Preview 组件卸载时调用） */
export function destroyPreview(): void {
  preview.destroy()
}
