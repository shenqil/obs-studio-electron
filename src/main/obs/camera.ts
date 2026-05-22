/**
 * 摄像头源管理模块
 */
import * as osn from '@shen9401/obs-studio-node'
import { isOBSInitialized } from './core'
import { addSourceToScene } from './scene'
import type { CameraDevice } from './types'

/**
 * 获取可用的摄像头设备列表
 */
export function getCameraDevices(): CameraDevice[] {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return []
  }

  try {
    const result = osn.NodeObs.OBS_settings_getVideoDevices()
    if (!result || !Array.isArray(result)) {
      return []
    }

    return result.map((device) => ({
      id: device.id || device.device || '',
      name: device.name || device.description || ''
    }))
  } catch (error) {
    console.error('Failed to get camera devices:', error)
    return []
  }
}

/**
 * 添加摄像头源
 */
export function addCameraSource(deviceId: string): string | null {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return null
  }

  try {
    const sourceName = `camera_${Date.now()}`

    // macOS 使用 av_capture_input，Windows 使用 dshow_input
    const inputType = process.platform === 'darwin' ? 'av_capture_input' : 'dshow_input'

    // 设置设备属性
    const settings =
      process.platform === 'darwin' ? { device: deviceId } : { video_device_id: deviceId }

    const source = osn.InputFactory.create(inputType, sourceName, settings)

    // 添加到场景
    const sceneItem = addSourceToScene(source)
    if (!sceneItem) {
      source.release()
      return null
    }

    console.debug('Camera source added:', sourceName)
    return sourceName
  } catch (error) {
    console.error('Failed to add camera source:', error)
    return null
  }
}
