/**
 * OBS 模块统一导出
 */

// 类型
export * from './types'

// 核心
export {
  initOBSCore,
  shutdownOBSCore,
  setSignalCallback,
  isOBSInitialized,
  DEFAULT_VIDEO_CONFIG,
  getVideoConfig,
  getVideoContext,
  createVideoContext
} from './core'

// 场景
export {
  initScene,
  getCurrentScene,
  getSceneItems,
  findSourceByName,
  addSourceToScene,
  removeSceneItem,
  setSceneItemVisible,
  destroyScene,
  getSources,
  removeSource,
  setSourceVisible,
  moveSourceUp,
  moveSourceDown,
  DEFAULT_SCENE_NAME
} from './scene'

// 摄像头
export { getCameraDevices, addCameraSource } from './camera'

// 显示器
export { getMonitorDevices, addMonitorSource } from './monitor'

// 窗口
export { getWindowDevices, addWindowSource } from './window'

// 推流
export {
  setRTMPConfig,
  getRTMPConfig,
  startStreaming,
  stopStreaming,
  getStreamState
} from './streaming'

// 预览
export {
  setupPreview,
  resizePreview,
  destroyPreview,
  isPreviewActive,
  getDisplayInfo,
  setShouldDrawUI,
  setDrawGuideLines
} from './preview'

// 便捷方法
import { initOBSCore, shutdownOBSCore } from './core'
import { initScene, destroyScene } from './scene'
import { destroyPreview } from './preview'

/**
 * 初始化 OBS（包含核心和场景）
 */
export function initOBS(): void {
  initOBSCore()
  initScene()
}

/**
 * 关闭 OBS（完整清理）
 */
export function shutdownOBS(): void {
  destroyPreview()
  destroyScene()
  shutdownOBSCore()
}
