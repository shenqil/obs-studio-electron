/**
 * 场景管理模块
 */
import * as osn from '@shen9401/obs-studio-node'
import { isOBSInitialized } from './core'

// 默认场景名称
const DEFAULT_SCENE_NAME = 'MainScene'

// 当前场景
let currentScene: osn.IScene | null = null

/**
 * 初始化默认场景
 */
export function initScene(): osn.IScene | null {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return null
  }

  try {
    // 创建或获取默认场景
    currentScene = osn.SceneFactory.create(DEFAULT_SCENE_NAME)
    console.debug('Scene initialized:', DEFAULT_SCENE_NAME)
    osn.Global.setOutputSource(0, currentScene)
    return currentScene
  } catch (error) {
    console.error('Failed to initialize scene:', error)
    return null
  }
}

/**
 * 获取当前场景
 */
export function getCurrentScene(): osn.IScene | null {
  return currentScene
}

/**
 * 获取场景中的所有源项
 */
export function getSceneItems(): osn.ISceneItem[] {
  if (!currentScene) {
    return []
  }

  try {
    return currentScene.getItems()
  } catch (error) {
    console.error('Failed to get scene items:', error)
    return []
  }
}

/**
 * 通过 sourceName 查找对应的源
 */
export function findSourceByName(
  sourceName: string
): { sceneItem: osn.ISceneItem; source: osn.IInput } | null {
  if (!currentScene) {
    return null
  }

  try {
    const items = currentScene.getItems()
    for (const item of items) {
      const source = item.source
      if (source && source.name === sourceName) {
        return { sceneItem: item, source }
      }
    }
    return null
  } catch (error) {
    console.error('Failed to find source by name:', error)
    return null
  }
}

/**
 * 添加源到场景
 */
export function addSourceToScene(source: osn.IInput): osn.ISceneItem | null {
  if (!currentScene) {
    console.error('No scene available')
    return null
  }

  try {
    const sceneItem = currentScene.add(source)
    console.debug('Source added to scene')
    return sceneItem
  } catch (error) {
    console.error('Failed to add source to scene:', error)
    return null
  }
}

/**
 * 从场景移除源项
 */
export function removeSceneItem(item: osn.ISceneItem): boolean {
  try {
    item.remove()
    console.debug('Scene item removed')
    return true
  } catch (error) {
    console.error('Failed to remove scene item:', error)
    return false
  }
}

/**
 * 设置源项可见性
 */
export function setSceneItemVisible(item: osn.ISceneItem, visible: boolean): void {
  try {
    item.visible = visible
  } catch (error) {
    console.error('Failed to set scene item visibility:', error)
  }
}

/**
 * 销毁场景
 */
export function destroyScene(): void {
  if (currentScene) {
    try {
      // 获取所有场景项并移除、释放
      const items = currentScene.getItems()
      items.forEach((item) => {
        try {
          item.remove()
          item.source.release()
        } catch {
          // ignore
        }
      })
      currentScene = null
      console.debug('Scene destroyed')
    } catch (error) {
      console.error('Failed to destroy scene:', error)
    }
  }
}
