/**
 * [module] 扬声器（音频输出设备）
 *
 * 职责：枚举音频输出设备、创建扬声器采集源（采集系统/设备的输出声音）、切换设备。
 * 仅返回 IInput，不负责加入场景、不附加滤镜（由 api 层组装编排）。
 *
 * 平台差异：
 *   - Windows：`wasapi_output_capture`，可枚举具体输出设备，按 device_id 采集。
 *   - macOS：无法枚举音频输出设备，列表固定返回单个「Default」；采集走 `mac_screen_capture`
 *     仅取桌面音频（视频部分由 api 层把场景项缩放为 0、不可见）。切换设备无意义（忽略）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import {
  IS_MACOS,
  SPEAKER_INPUT_TYPE,
  MAC_DESKTOP_AUDIO_TYPE,
  SOURCE_NAME_PREFIX
} from '../common/constants'
import type { SpeakerDevice, CreateSourceParams } from '../../../shared/types'

const log = createLogger('speaker')

interface RawAudioDevice {
  id: string
  description: string
}

/** macOS 桌面音频的「默认设备」占位项（系统不提供输出设备枚举）。 */
const MAC_DEFAULT_DEVICE: SpeakerDevice = { id: 'default', name: 'Default' }

/**
 * 获取可用扬声器（音频输出）设备列表。
 * macOS 固定返回单个「Default」；Windows 枚举 wasapi 输出设备。
 */
export function listDevices(): SpeakerDevice[] {
  if (IS_MACOS) {
    log.debug('macOS speaker: return single default device')
    return [MAC_DEFAULT_DEVICE]
  }

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
 *   - macOS：创建 `mac_screen_capture` 仅采集桌面音频（capture_audio=true、不显示光标）。
 *   - Windows：创建 `wasapi_output_capture` 按 device_id 采集。
 *
 * @returns 创建的输入源
 */
export function createInput(params: CreateSourceParams): osn.IInput {
  const sourceName = `${SOURCE_NAME_PREFIX.speaker}${Date.now()}`

  if (IS_MACOS) {
    log.debug('Creating mac desktop audio input:', { sourceName, type: MAC_DESKTOP_AUDIO_TYPE })
    const input = osn.InputFactory.create(MAC_DESKTOP_AUDIO_TYPE, sourceName, {
      capture_audio: true,
      show_cursor: false,
      type: 0
    })
    // 仅音频混音：放到推流音轨
    input.audioMixers = 1
    log.info('Mac desktop audio input created:', sourceName)
    return input
  }

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
 * macOS 桌面音频无设备概念，忽略。
 * @param input 已存在的扬声器输入源
 * @param deviceId 新设备 id
 */
export function switchDevice(input: osn.IInput, deviceId: string): void {
  if (IS_MACOS) {
    log.debug('macOS speaker: switchDevice ignored (desktop audio has no device)')
    return
  }
  log.info('Switching speaker device to:', deviceId)
  input.update({ device_id: deviceId })
}
