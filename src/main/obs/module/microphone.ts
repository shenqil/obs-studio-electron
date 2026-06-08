/**
 * [module] 麦克风（音频输入设备）
 *
 * 职责：枚举音频输入设备、创建麦克风输入源、切换设备。
 * 仅返回 IInput，不负责加入场景、不附加滤镜（由 api 层组装编排）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { MIC_INPUT_TYPE, SOURCE_NAME_PREFIX } from '../common/constants'
import type { MicrophoneDevice, CreateSourceParams } from '../../../shared/types'

const log = createLogger('microphone')

interface RawAudioDevice {
  id: string
  description: string
}

/**
 * 获取可用麦克风（音频输入）设备列表。
 */
export function listDevices(): MicrophoneDevice[] {
  log.debug('Listing microphone devices')
  const result = osn.NodeObs.OBS_settings_getInputAudioDevices() as RawAudioDevice[] | undefined

  if (!Array.isArray(result)) {
    log.warn('OBS_settings_getInputAudioDevices returned no array')
    return []
  }

  const devices = result.map((device) => ({
    id: device.id,
    name: device.description
  }))
  log.info(`Found ${devices.length} microphone device(s)`)
  return devices
}

/**
 * 创建麦克风输入源（不含滤镜）。
 * 降噪滤镜的附加由 api 层编排（调用 noiseFilter 模块），避免 module 间互相依赖。
 *
 * @returns 创建的输入源
 */
export function createInput(params: CreateSourceParams): osn.IInput {
  const sourceName = `${SOURCE_NAME_PREFIX.microphone}${Date.now()}`
  const settings = { device_id: params.id }

  log.debug('Creating microphone input:', { sourceName, deviceId: params.id, type: MIC_INPUT_TYPE })
  const input = osn.InputFactory.create(MIC_INPUT_TYPE, sourceName, settings)

  log.info('Microphone input created:', sourceName)
  return input
}

/**
 * 切换麦克风设备（更新已有源的 device_id）。
 * @param input 已存在的麦克风输入源
 * @param deviceId 新设备 id
 */
export function switchDevice(input: osn.IInput, deviceId: string): void {
  log.info('Switching microphone device to:', deviceId)
  input.update({ device_id: deviceId })
}
