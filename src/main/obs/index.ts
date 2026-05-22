/**
 * OBS 模块统一导出
 */

// 类型
export * from './types'

// 核心
export { initOBSCore, shutdownOBSCore, setSignalCallback, isOBSInitialized } from './core'

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
  getSources
} from './scene'

// 摄像头
export {
  getCameraDevices,
  addCameraSource,
  removeCameraSource,
  setCameraSourceVisible
} from './camera'

// 推流
export {
  setRTMPConfig,
  getRTMPConfig,
  startStreaming,
  stopStreaming,
  getStreamState
} from './streaming'

// 便捷方法
import { initOBSCore, shutdownOBSCore } from './core'
import { initScene, destroyScene } from './scene'

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
  destroyScene()
  shutdownOBSCore()
}
