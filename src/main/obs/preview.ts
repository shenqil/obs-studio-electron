/**
 * OBS 预览模块 - 负责创建和管理预览显示
 *
 * 实现 OBS 场景预览功能，支持 macOS 和 Windows 平台
 * macOS 使用 IOSurface 和 node-window-rendering 进行渲染
 * Windows 直接使用 OBS 的 display API
 */
import { BrowserWindow, screen } from 'electron'
import * as osn from '@shen9401/obs-studio-node'
import { isOBSInitialized, getVideoConfig, getVideoContext } from './core'
import { DEFAULT_SCENE_NAME } from './scene'

// 显示器 ID
const DISPLAY_ID = 'preview-display'

// 平台检测
const isMacOS = process.platform === 'darwin'

// node-window-rendering 模块（仅 macOS 需要）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nwr: any = null

// 窗口状态
let existingWindow = false
let displayDestroyed = false
let currentWindowId: number | null = null
let currentScale = 1

/**
 * 初始化 node-window-rendering（仅 macOS）
 */
function initNWR(): void {
  if (isMacOS && !nwr) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      nwr = require('node-window-rendering')
    } catch (error) {
      console.error('Failed to load node-window-rendering:', error)
      throw new Error('node-window-rendering is required on macOS for preview rendering')
    }
  }
}

/**
 * 获取显示器信息
 */
export function getDisplayInfo(): {
  width: number
  height: number
  scaleFactor: number
} {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size
  const { scaleFactor } = primaryDisplay

  return {
    width,
    height,
    scaleFactor
  }
}

/**
 * 创建 OBS 显示
 */
function createOBSDisplay(electronWindowId: number, name: string, sourceId?: string): void {
  const electronWindow = BrowserWindow.fromId(electronWindowId)
  if (!electronWindow) {
    throw new Error(`Window with id ${electronWindowId} not found`)
  }

  const handle = electronWindow.getNativeWindowHandle()
  const context = getVideoContext()!

  if (sourceId) {
    // 创建源预览显示
    // 参数：窗口句柄、源ID、显示名称、是否绘制UI、上下文
    osn.NodeObs.OBS_content_createSourcePreviewDisplay(handle, sourceId, name, false, context)
  } else {
    // 创建普通显示
    // 参数：窗口句柄、显示名称、渲染模式、是否绘制UI、上下文
    osn.NodeObs.OBS_content_createDisplay(
      handle,
      name,
      0, // OBS_MAIN_RENDERING
      false,
      context
    )
  }
}

/**
 * 设置显示填充颜色
 */
function setOBSDisplayPaddingColor(name: string, r: number, g: number, b: number): void {
  osn.NodeObs.OBS_content_setPaddingColor(name, r, g, b)
}

/**
 * 设置显示填充大小
 */
function setOBSDisplayPaddingSize(name: string, size: number): void {
  osn.NodeObs.OBS_content_setPaddingSize(name, size)
}

/**
 * 移动显示
 */
function moveOBSDisplay(name: string, x: number, y: number): void {
  if (isMacOS && nwr) {
    nwr.moveWindow(name, x, y)
  } else {
    osn.NodeObs.OBS_content_moveDisplay(name, x, y)
  }
}

/**
 * 调整显示大小
 */
function resizeOBSDisplay(name: string, width: number, height: number): void {
  osn.NodeObs.OBS_content_resizeDisplay(name, width, height)
}

/**
 * 销毁显示
 */
function destroyOBSDisplay(name: string): void {
  osn.NodeObs.OBS_content_destroyDisplay(name)
}

/**
 * 创建 IOSurface（仅 macOS）
 */
function createOBSIOSurface(name: string): unknown {
  return osn.NodeObs.OBS_content_createIOSurface(name)
}

/**
 * 设置预览显示
 * @param window BrowserWindow 实例
 * @param bounds 预览区域的边界 { x, y, width, height }
 * @param sceneName 场景名称（可选，默认使用 MainScene）
 * @returns 预览高度
 */
export function setupPreview(
  window: BrowserWindow,
  bounds: { x: number; y: number; width: number; height: number },
  sceneName?: string
): { height: number } | null {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return null
  }

  try {
    // macOS 需要初始化 NWR
    if (isMacOS) {
      initNWR()
    }

    // 保存窗口 ID
    currentWindowId = window.id
    currentScale = getDisplayInfo().scaleFactor

    // 使用场景名称或默认场景
    const sourceId = sceneName || DEFAULT_SCENE_NAME

    console.debug('Setting up preview display:', {
      displayId: DISPLAY_ID,
      sourceId,
      bounds
    })

    // 创建 OBS 显示
    createOBSDisplay(window.id, DISPLAY_ID, sourceId)

    // 设置填充颜色（默认深色背景）
    setOBSDisplayPaddingColor(DISPLAY_ID, 11, 22, 28)
    setOBSDisplayPaddingSize(DISPLAY_ID, 0)

    // 重置窗口状态
    existingWindow = false
    displayDestroyed = false

    // 调整预览大小
    return resizePreview(window, bounds)
  } catch (error) {
    console.error('Failed to setup preview:', error)
    return null
  }
}

/**
 * 调整预览显示大小
 * @param window BrowserWindow 实例
 * @param bounds 新的预览区域边界 { x, y, width, height }
 * @returns 预览高度
 */
export function resizePreview(
  window: BrowserWindow,
  bounds: { x: number; y: number; width: number; height: number }
): { height: number } {
  if (displayDestroyed) {
    console.warn('Display is destroyed, cannot resize')
    return { height: bounds.height }
  }

  // macOS 零尺寸不渲染
  if (isMacOS && (bounds.width === 0 || bounds.height === 0)) {
    return { height: bounds.height }
  }

  const displayInfo = getDisplayInfo()
  const videoConfig = getVideoConfig()
  const [, windowHeight] = window.getSize()

  // macOS 需要检测 scale 变化
  if (isMacOS) {
    const scaleFactor = displayInfo.scaleFactor
    if (currentScale !== scaleFactor) {
      currentScale = scaleFactor
    }
  }

  // 计算缩放因子
  // macOS 不需要调整 scaleFactor
  const factor = isMacOS ? 1 : displayInfo.scaleFactor

  // Windows: 左上角原点
  // macOS: 左下角原点
  const yCoord = isMacOS ? windowHeight - bounds.y - bounds.height : bounds.y

  const displayX = Math.floor(bounds.x * factor)
  const displayY = Math.floor(yCoord * factor)
  const displayWidth = Math.floor(bounds.width * factor)
  const displayHeight = Math.floor(bounds.height * factor)

  // 使用视频配置计算预览宽高比
  const aspectRatio = videoConfig.baseWidth / videoConfig.baseHeight
  const scaledHeight = Math.round(displayWidth / aspectRatio)

  console.debug('Resizing preview display:', {
    displayX,
    displayY,
    displayWidth,
    displayHeight: scaledHeight,
    factor
  })

  // 调整显示大小
  resizeOBSDisplay(DISPLAY_ID, displayWidth, displayHeight)

  // macOS 需要重新创建 IOSurface
  if (isMacOS && nwr) {
    if (existingWindow) {
      nwr.destroyWindow(DISPLAY_ID)
      nwr.destroyIOSurface(DISPLAY_ID)
    }

    try {
      const surface = createOBSIOSurface(DISPLAY_ID)
      nwr.createWindow(DISPLAY_ID, window.getNativeWindowHandle())
      existingWindow = true
      nwr.connectIOSurface(DISPLAY_ID, surface)
      nwr.moveWindow(DISPLAY_ID, displayX, displayY)
    } catch (error) {
      console.error('Error creating IOSurface:', error)
    }
  } else {
    // Windows 直接移动显示
    moveOBSDisplay(DISPLAY_ID, displayX, displayY)
  }

  return { height: bounds.height }
}

/**
 * 销毁预览显示
 */
export function destroyPreview(): void {
  if (displayDestroyed) {
    return
  }

  try {
    // macOS 需要销毁 NWR 资源
    if (isMacOS && nwr && existingWindow) {
      nwr.destroyWindow(DISPLAY_ID)
      nwr.destroyIOSurface(DISPLAY_ID)
      existingWindow = false
    }

    // 销毁显示
    destroyOBSDisplay(DISPLAY_ID)

    displayDestroyed = true
    currentWindowId = null

    console.debug('Preview display destroyed')
  } catch (error) {
    console.error('Failed to destroy preview:', error)
  }
}

/**
 * 检查预览是否活跃
 */
export function isPreviewActive(): boolean {
  return !displayDestroyed && currentWindowId !== null
}

/**
 * 获取预览偏移量
 */
export function getPreviewOffset(): { x: number; y: number } {
  try {
    return osn.NodeObs.OBS_content_getDisplayPreviewOffset(DISPLAY_ID)
  } catch (error) {
    console.error('Failed to get preview offset:', error)
    return { x: 0, y: 0 }
  }
}

/**
 * 获取预览尺寸
 */
export function getPreviewSize(): { width: number; height: number } {
  try {
    return osn.NodeObs.OBS_content_getDisplayPreviewSize(DISPLAY_ID)
  } catch (error) {
    console.error('Failed to get preview size:', error)
    return { width: 0, height: 0 }
  }
}

/**
 * 设置是否绘制 UI
 */
export function setShouldDrawUI(drawUI: boolean): void {
  try {
    osn.NodeObs.OBS_content_setShouldDrawUI(DISPLAY_ID, drawUI)
  } catch (error) {
    console.error('Failed to set should draw UI:', error)
  }
}

/**
 * 设置是否绘制参考线
 */
export function setDrawGuideLines(drawGuideLines: boolean): void {
  try {
    osn.NodeObs.OBS_content_setDrawGuideLines(DISPLAY_ID, drawGuideLines)
  } catch (error) {
    console.error('Failed to set draw guide lines:', error)
  }
}
