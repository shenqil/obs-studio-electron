/**
 * 场景管理模块
 */
import * as osn from '@shen9401/obs-studio-node'
import { isOBSInitialized } from './core'
import type { SourceInfo, SourceType } from './types'

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
 * 移动源项上移
 */
export function moveSceneItemUp(item: osn.ISceneItem): void {
  try {
    item.moveUp()
  } catch (error) {
    console.error('Failed to move scene item up:', error)
  }
}

/**
 * 移动源项下移
 */
export function moveSceneItemDown(item: osn.ISceneItem): void {
  try {
    item.moveDown()
  } catch (error) {
    console.error('Failed to move scene item down:', error)
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

/**
 * 移除源
 */
export function removeSource(sourceName: string): boolean {
  const found = findSourceByName(sourceName)
  if (!found) {
    console.warn('Source not found:', sourceName)
    return false
  }

  try {
    removeSceneItem(found.sceneItem)
    found.source.release()
    console.debug('Source removed:', sourceName)
    return true
  } catch (error) {
    console.error('Failed to remove source:', error)
    return false
  }
}

/**
 * 设置源可见性
 */
export function setSourceVisible(sourceName: string, visible: boolean): boolean {
  const found = findSourceByName(sourceName)
  if (!found) {
    console.warn('Source not found:', sourceName)
    return false
  }

  try {
    setSceneItemVisible(found.sceneItem, visible)
    return true
  } catch (error) {
    console.error('Failed to set source visibility:', error)
    return false
  }
}

/**
 * 上移源
 */
export function moveSourceUp(sourceName: string): boolean {
  const found = findSourceByName(sourceName)
  if (!found) {
    console.warn('Source not found:', sourceName)
    return false
  }

  try {
    moveSceneItemUp(found.sceneItem)
    return true
  } catch (error) {
    console.error('Failed to move source up:', error)
    return false
  }
}

/**
 * 下移源
 */
export function moveSourceDown(sourceName: string): boolean {
  const found = findSourceByName(sourceName)
  if (!found) {
    console.warn('Source not found:', sourceName)
    return false
  }

  try {
    moveSceneItemDown(found.sceneItem)
    return true
  } catch (error) {
    console.error('Failed to move source down:', error)
    return false
  }
}

/**
 * 获取所有源信息
 */
export function getSources(): SourceInfo[] {
  const items = getSceneItems()
  return items.map((item) => {
    const source = item.source
    const settings = source?.settings || {}
    const sourceName = source?.name || ''

    // 根据 sourceName 前缀判断类型
    let type: SourceType = 'camera'
    if (sourceName.startsWith('monitor_')) {
      type = 'monitor'
    } else if (sourceName.startsWith('window_')) {
      type = 'window'
    }

    return {
      id: settings.device || settings.monitor_id || settings.window || '',
      name: settings.device_name || settings.monitor_name || settings.window_name || sourceName,
      sourceName,
      type,
      visible: item.visible
    }
  })
}
