/**
 * [module] 摄像头
 *
 * 职责：枚举摄像头设备、创建摄像头输入源。
 * 仅返回 IInput，不负责加入场景（由 api 层组装）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { CAMERA_INPUT_TYPE, IS_MACOS, SOURCE_NAME_PREFIX } from '../common/constants'
import type { CameraDevice, CreateSourceParams } from '../../../shared/types'

const log = createLogger('camera')

interface RawVideoDevice {
  id: string
  description: string
}

/**
 * 获取可用摄像头设备列表。
 */
export function listDevices(): CameraDevice[] {
  log.debug('Listing camera devices')
  const result = osn.NodeObs.OBS_settings_getVideoDevices() as RawVideoDevice[] | undefined

  if (!Array.isArray(result)) {
    log.warn('OBS_settings_getVideoDevices returned no array')
    return []
  }

  const devices = result.map((device) => ({
    id: device.id,
    name: device.description
  }))
  log.info(`Found ${devices.length} camera device(s)`)
  return devices
}

/**
 * 创建摄像头输入源。
 *
 * 只写设备相关 settings；name/label/type 由 api 层写入本地缓存（sourceStore），不入 OBS settings。
 * @returns 创建的输入源
 */
export function createInput(params: CreateSourceParams): osn.IInput {
  const sourceName = `${SOURCE_NAME_PREFIX.camera}${Date.now()}`
  const settings = IS_MACOS ? { device: params.id } : { video_device_id: params.id }

  log.debug('Creating camera input:', { sourceName, deviceId: params.id, type: CAMERA_INPUT_TYPE })
  const input = osn.InputFactory.create(CAMERA_INPUT_TYPE, sourceName, settings)
  log.info('Camera input created:', sourceName)
  return input
}

/**
 * 切换摄像头设备（更新已有源的设备 settings）。入参与 createInput 一致。
 */
export function switchDevice(input: osn.IInput, params: CreateSourceParams): void {
  log.info('Switching camera device to:', params.id)
  input.update(IS_MACOS ? { device: params.id } : { video_device_id: params.id })
}
