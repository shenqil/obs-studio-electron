/**
 * [api] 预览
 *
 * 预览生命周期分两段：
 *   - 上下文准备：监听 core:initialized 缓存 window + videoContext，发出 preview:initialized；
 *     销毁时监听 lifecycle:destroy 释放 Display，发出 preview:destroyed（scene 在等它）。
 *   - 显示创建：由渲染进程通过 IPC 驱动：
 *       setupPreview（组件挂载，仅一次）/ resizePreview（布局变化）/ destroyPreview（卸载）
 *
 * preview 模块本身是纯能力（不监听事件），事件编排集中在本文件。
 */
import { preview } from '../module'
import { obsEvents } from '../common/events'

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

// ============================================================================
// 事件驱动生命周期（依赖有序，无互锁）
// ============================================================================
//
// init：依赖 core。监听 core:initialized，缓存 window + videoContext（真正的 Display 创建
//       仍由渲染进程在组件挂载时通过 IPC setupPreview() 触发），完成后发出 preview:initialized。
// destroy：预览持有 Display（也持有 video canvas），需在 scene/core 销毁前释放。监听根触发
//       lifecycle:destroy，用 try/finally 保证 preview:destroyed 无条件发出（scene 在等它）。

obsEvents.on('core:initialized', ({ window, videoContext }) => {
  preview.setContext(window, videoContext)
  obsEvents.emit('preview:initialized')
})

obsEvents.on('lifecycle:destroy', () => {
  try {
    preview.destroy()
  } finally {
    obsEvents.emit('preview:destroyed')
  }
})
