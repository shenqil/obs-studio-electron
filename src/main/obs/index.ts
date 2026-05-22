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
  destroyScene
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
import { initScene, destroyScene, getSceneItems } from './scene'
import type { SourceInfo } from './types'

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

/**
 * 获取所有源信息
 */
export function getSources(): SourceInfo[] {
  const items = getSceneItems()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.map((item: any) => {
    const source = item.source
    return {
      id: source?.name || '',
      name: source?.name || '',
      type: 'camera' as const,
      visible: item.visible
    }
  })
}
