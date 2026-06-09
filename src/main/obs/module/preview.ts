/**
 * [module] 预览
 *
 * 职责：在 Electron 窗口内创建/移动/缩放/销毁 OBS 预览显示。
 * macOS 通过 IOSurface + node-window-rendering 渲染；Windows 直接使用 OBS display API。
 *
 * 生命周期：
 *   1. setContext(window, videoContext) — 由 api/lifecycle 在 initialize 时调用，缓存依赖
 *   2. init(bounds) — 由渲染进程通过 IPC 调用，真正创建 OBS display（只执行一次）
 *   3. resize(bounds) — 渲染进程布局变化时调用
 *   4. destroy() — 渲染进程卸载或 OBS 销毁时调用
 */
import { BrowserWindow } from 'electron'
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { getNativeBinaryPath } from '../common/utils'
import {
  DISPLAY_ID,
  IS_MACOS,
  DEFAULT_VIDEO_CONFIG,
  RENDERING_MODE_MAIN,
  PREVIEW_PADDING_RGB,
  PREVIEW_PADDING_SIZE
} from '../common/constants'

const log = createLogger('preview')

interface PreviewBounds {
  x: number
  y: number
  width: number
  height: number
}

// node-window-rendering（仅 macOS）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nwr: any = null

// 缓存的依赖
let cachedWindow: BrowserWindow | null = null
let cachedVideoContext: osn.IVideo | null = null

// 预览状态
let hasNwrWindow = false
let initialized = false

/**
 * 预览几何缓存。
 * offset/size/factor 仅在预览尺寸或窗口缩放变化时改变，即只随 resize 变。
 * getPreviewGeometry 内部是两次同步跨进程 osn 调用，故缓存复用，resize/destroy 时失效。
 */
type PreviewGeometry = {
  offset: { x: number; y: number }
  size: { width: number; height: number }
  factor: number
}
let cachedGeometry: PreviewGeometry | null = null

/** 懒加载 macOS 渲染依赖 */
function ensureNwr(): void {
  if (!IS_MACOS || nwr) return
  try {
    const binaryPath = getNativeBinaryPath('node-window-rendering', 'node_window_rendering.node')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nwr = require(binaryPath)
  } catch (error) {
    log.error('Failed to load node-window-rendering:', error)
    throw new Error('node-window-rendering is required on macOS for preview rendering')
  }
}

/**
 * 缓存预览所需的窗口和视频上下文（由 lifecycle.initialize 调用）。
 */
export function setContext(window: BrowserWindow, videoContext: osn.IVideo | null): void {
  cachedWindow = window
  cachedVideoContext = videoContext
  log.debug('Preview context cached')
}

/** 预览是否已初始化 */
export function isInitialized(): boolean {
  return initialized
}

/**
 * 真正创建 OBS 预览显示（只执行一次）。
 * 由渲染进程在 Preview 组件挂载时通过 IPC 调用。
 */
export function init(bounds: PreviewBounds): { height: number } | null {
  if (initialized) {
    log.warn('Preview already initialized, skip')
    return resize(bounds)
  }

  if (!cachedWindow) {
    log.error('Cannot init preview: no cached window')
    return null
  }

  if (!cachedVideoContext) {
    log.error('Cannot init preview: no video context')
    return null
  }

  if (IS_MACOS) ensureNwr()

  log.info('Initializing preview display:', { displayId: DISPLAY_ID, bounds })

  const handle = cachedWindow.getNativeWindowHandle()
  osn.NodeObs.OBS_content_createDisplay(
    handle,
    DISPLAY_ID,
    RENDERING_MODE_MAIN,
    false,
    cachedVideoContext
  )

  osn.NodeObs.OBS_content_setPaddingColor(
    DISPLAY_ID,
    PREVIEW_PADDING_RGB.r,
    PREVIEW_PADDING_RGB.g,
    PREVIEW_PADDING_RGB.b
  )
  osn.NodeObs.OBS_content_setPaddingSize(DISPLAY_ID, PREVIEW_PADDING_SIZE)

  // 闸门 1：允许绘制 UI 层（选择框 / 手柄）。
  // 配合 scene 模块的闸门 2/3/4，选中的源会叠加 OBS 风格选择框。
  osn.NodeObs.OBS_content_setShouldDrawUI(DISPLAY_ID, true)

  // 辅助线（拖拽时的对齐参考线），部分版本可能缺失
  osn.NodeObs.OBS_content_setDrawGuideLines?.(DISPLAY_ID, true)

  hasNwrWindow = false
  initialized = true

  return resize(bounds)
}

/**
 * 调整预览显示的位置与尺寸。
 */
export function resize(bounds: PreviewBounds): { height: number } {
  if (!initialized || !cachedWindow) {
    log.warn('Cannot resize: preview not initialized')
    return { height: bounds.height }
  }

  if (IS_MACOS && (bounds.width === 0 || bounds.height === 0)) {
    return { height: bounds.height }
  }

  const factor = IS_MACOS ? 1 : (cachedWindow.webContents.getZoomFactor?.() ?? 1)

  const contentHeight = cachedWindow.getContentSize()[1]
  const yCoord = IS_MACOS ? contentHeight - bounds.y - bounds.height : bounds.y

  const displayX = Math.floor(bounds.x * factor)
  const displayY = Math.floor(yCoord * factor)
  const displayWidth = Math.floor(bounds.width * factor)
  const displayHeight = Math.floor(bounds.height * factor)

  log.debug('Resizing preview:', { displayX, displayY, displayWidth, displayHeight, factor })
  osn.NodeObs.OBS_content_resizeDisplay(DISPLAY_ID, displayWidth, displayHeight)
  cachedGeometry = null // 尺寸变了，几何缓存失效

  if (IS_MACOS && nwr) {
    if (hasNwrWindow) {
      nwr.destroyWindow(DISPLAY_ID)
      nwr.destroyIOSurface(DISPLAY_ID)
    }
    try {
      const surface = osn.NodeObs.OBS_content_createIOSurface(DISPLAY_ID)
      nwr.createWindow(DISPLAY_ID, cachedWindow.getNativeWindowHandle())
      hasNwrWindow = true
      nwr.connectIOSurface(DISPLAY_ID, surface)
      nwr.moveWindow(DISPLAY_ID, displayX, displayY)
    } catch (error) {
      log.error('Error creating IOSurface:', error)
    }
  } else {
    osn.NodeObs.OBS_content_moveDisplay(DISPLAY_ID, displayX, displayY)
  }

  const aspectRatio = DEFAULT_VIDEO_CONFIG.baseWidth / DEFAULT_VIDEO_CONFIG.baseHeight
  return { height: Math.round(bounds.width / aspectRatio) }
}

/**
 * 读取预览几何，用于把容器内的鼠标坐标换算到画布坐标。
 *
 * - offset/size 为 OBS 画面在 Display 内的偏移与渲染尺寸（设备像素），
 *   用于去掉 letterbox 黑边。
 * - factor 为窗口缩放因子，渲染层传来的 CSS 像素需乘以它换算成设备像素。
 *
 * 几何只随 resize 变化，故内部缓存复用（避免 hover/拖拽热路径每帧双 IPC），
 * resize/destroy 时失效。不同 osn 版本返回字段可能是 {x,y} 或 {width,height}，做兼容归一。
 */
export function getPreviewGeometry(): PreviewGeometry | null {
  if (!initialized) {
    return null
  }
  if (cachedGeometry) {
    return cachedGeometry
  }

  const offset = osn.NodeObs.OBS_content_getDisplayPreviewOffset(DISPLAY_ID)
  const size = osn.NodeObs.OBS_content_getDisplayPreviewSize(DISPLAY_ID)
  const factor = IS_MACOS ? 1 : (cachedWindow?.webContents.getZoomFactor?.() ?? 1)

  cachedGeometry = {
    offset: { x: offset?.x ?? 0, y: offset?.y ?? 0 },
    size: {
      width: size?.width ?? size?.x ?? 0,
      height: size?.height ?? size?.y ?? 0
    },
    factor
  }
  return cachedGeometry
}

/**
 * 销毁预览显示并释放相关资源。
 */
export function destroy(): void {
  if (!initialized) return

  log.info('Destroying preview display')
  if (IS_MACOS && nwr && hasNwrWindow) {
    nwr.destroyWindow(DISPLAY_ID)
    nwr.destroyIOSurface(DISPLAY_ID)
    hasNwrWindow = false
  }

  osn.NodeObs.OBS_content_destroyDisplay(DISPLAY_ID)
  cachedGeometry = null
  initialized = false
  log.debug('Preview display destroyed')
}
