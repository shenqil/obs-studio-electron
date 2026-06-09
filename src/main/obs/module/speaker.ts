/**
 * [module] 扬声器（音频输出设备）
 *
 * 职责：枚举音频输出设备、创建扬声器采集源（采集系统/设备的输出声音）、切换设备。
 * 仅返回 IInput，不负责加入场景、不附加滤镜（由 api 层组装编排）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { SPEAKER_INPUT_TYPE, SOURCE_NAME_PREFIX } from '../common/constants'
import type { SpeakerDevice, CreateSourceParams } from '../../../shared/types'

const log = createLogger('speaker')

interface RawAudioDevice {
  id: string
  description: string
}

/**
 * 获取可用扬声器（音频输出）设备列表。
 */
export function listDevices(): SpeakerDevice[] {
  log.debug('Listing speaker devices')
  const result = osn.NodeObs.OBS_settings_getOutputAudioDevices() as RawAudioDevice[] | undefined

  if (!Array.isArray(result)) {
    log.warn('OBS_settings_getOutputAudioDevices returned no array')
    return []
  }

  const devices = result.map((device) => ({
    id: device.id,
    name: device.description
  }))
  log.info(`Found ${devices.length} speaker device(s)`)
  return devices
}

/**
 * 创建扬声器采集输入源。
 *
 * @returns 创建的输入源
 */
export function createInput(params: CreateSourceParams): osn.IInput {
  const sourceName = `${SOURCE_NAME_PREFIX.speaker}${Date.now()}`
  const settings = { device_id: params.id }

  log.debug('Creating speaker input:', {
    sourceName,
    deviceId: params.id,
    type: SPEAKER_INPUT_TYPE
  })
  const input = osn.InputFactory.create(SPEAKER_INPUT_TYPE, sourceName, settings)

  log.info('Speaker input created:', sourceName)
  return input
}

/**
 * 切换扬声器设备（更新已有源的 device_id）。
 * @param input 已存在的扬声器输入源
 * @param deviceId 新设备 id
 */
export function switchDevice(input: osn.IInput, deviceId: string): void {
  log.info('Switching speaker device to:', deviceId)
  input.update({ device_id: deviceId })
}
