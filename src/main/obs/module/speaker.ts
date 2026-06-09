/**
 * [module] 扬声器（音频输出设备）—— 独立全局输出通道单例
 *
 * 扬声器是纯音频，不进场景树，挂到独立的全局输出通道（SPEAKER_OUTPUT_CHANNEL）。
 * 本模块自持有单例状态：当前 input、fader、设备信息。提供 set（创建/切换/复用）、
 * setVolume/getVolume、getState、release。
 *
 * 平台差异：
 *   - Windows：`wasapi_output_capture`，可枚举具体输出设备，按 device_id 采集。
 * macOS：无法枚举音频输出设备，列表固定返回单个「Default」；采集走 `sck_audio_capture`
 *     仅取桌面音频。切换设备无意义（始终同一个）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { tryRun } from '../common/safe'
import {
  IS_MACOS,
  SPEAKER_INPUT_TYPE,
  MAC_DESKTOP_AUDIO_TYPE,
  SOURCE_NAME_PREFIX,
  SPEAKER_OUTPUT_CHANNEL,
  FADER_TYPE_CUBIC
} from '../common/constants'
import type { SpeakerDevice, SpeakerState } from '../../../shared/types'

const log = createLogger('speaker')

interface RawAudioDevice {
  id: string
  description: string
}

/** macOS 桌面音频的「默认设备」占位项（系统不提供输出设备枚举）。 */
const MAC_DEFAULT_DEVICE: SpeakerDevice = { id: 'default', name: 'Default' }

// ── 单例状态 ────────────────────────────────────────────────────────────
let input: osn.IInput | null = null
let fader: osn.IFader | null = null
let deviceId = ''
let deviceName = ''

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

/** 创建底层扬声器采集源（不挂通道、不建 fader）。 */
function createInput(id: string): osn.IInput {
  const sourceName = `${SOURCE_NAME_PREFIX.speaker}${Date.now()}`

  if (IS_MACOS) {
    log.debug('Creating mac desktop audio input:', { sourceName, type: MAC_DESKTOP_AUDIO_TYPE })
    const created = osn.InputFactory.create(MAC_DESKTOP_AUDIO_TYPE, sourceName, {
      capture_audio: true,
      show_cursor: false,
      type: 0
    })
    created.audioMixers = 1
    return created
  }

  log.debug('Creating speaker input:', { sourceName, deviceId: id, type: SPEAKER_INPUT_TYPE })
  return osn.InputFactory.create(SPEAKER_INPUT_TYPE, sourceName, { device_id: id })
}

/**
 * 设置/切换扬声器：
 *   - 未创建：创建源 -> 挂到独立输出通道 -> 建 fader。
 *   - 已创建且设备相同：no-op。
 *   - 已创建且设备不同：update device_id（macOS 无设备概念，忽略切换）。
 *
 * 设备由调用方（业务）传入并负责正确性（如 macOS 传 default）；本模块不再覆写。
 * @returns 设置后的单例状态
 */
export function set(device: SpeakerDevice): SpeakerState {
  if (!input) {
    // 首次创建
    input = createInput(device.id)
    osn.Global.setOutputSource(SPEAKER_OUTPUT_CHANNEL, input)
    fader = osn.FaderFactory.create(FADER_TYPE_CUBIC)
    fader.attach(input)
    deviceId = device.id
    deviceName = device.name
    log.info('Speaker created on channel', SPEAKER_OUTPUT_CHANNEL, 'device:', device.name)
    return getState()!
  }

  if (deviceId === device.id) {
    log.debug('Speaker device unchanged, skip:', device.name)
    return getState()!
  }

  // 已创建且设备不同：更新设备（macOS 桌面音频无设备概念，忽略）
  if (!IS_MACOS) {
    log.info('Switching speaker device to:', device.name)
    input.update({ device_id: device.id })
    deviceId = device.id
    deviceName = device.name
  }
  return getState()!
}

/** 设置音量（0..1 的 deflection）。无扬声器返回 false。 */
export function setVolume(volume: number): boolean {
  if (!fader) {
    log.warn('setVolume: speaker not created')
    return false
  }
  fader.deflection = Math.max(0, Math.min(volume, 1))
  return true
}

/** 读取音量（0..1），无扬声器或异常返回兜底值 1。 */
export function getVolume(): number {
  if (!fader) {
    return 1
  }
  try {
    const deflection = fader.deflection
    return Number.isFinite(deflection) ? Math.max(0, Math.min(deflection, 1)) : 1
  } catch {
    return 1
  }
}

/** 设置静音 / 取消静音。无扬声器返回 false。 */
export function setMuted(muted: boolean): boolean {
  if (!input) {
    log.warn('setMuted: speaker not created')
    return false
  }
  input.muted = muted
  return true
}

/** 读取静音状态，无扬声器或异常返回 false。 */
export function getMuted(): boolean {
  if (!input) {
    return false
  }
  try {
    return Boolean(input.muted)
  } catch {
    return false
  }
}

/** 当前扬声器单例状态，未创建返回 null。 */
export function getState(): SpeakerState | null {
  if (!input) {
    return null
  }
  return { deviceId, deviceName, volume: getVolume(), muted: getMuted() }
}

/** 是否已创建扬声器。 */
export function isCreated(): boolean {
  return input !== null
}

/**
 * 释放扬声器：清空输出通道、释放 fader 与 input，重置单例状态。
 * 删除扬声器 / OBS 销毁时调用。
 */
export function release(): void {
  if (!input && !fader) {
    return
  }
  log.info('Releasing speaker')
  // 先从输出通道摘除（置空通道）。osn 类型要求 ISource，运行时传 null 即清空，做类型绕过。
  tryRun('speaker.clearChannel', () =>
    osn.Global.setOutputSource(SPEAKER_OUTPUT_CHANNEL, null as unknown as osn.ISource)
  )
  if (fader) {
    tryRun('speaker.fader.detach', () => fader!.detach())
    tryRun('speaker.fader.destroy', () => fader!.destroy())
    fader = null
  }
  if (input) {
    tryRun('speaker.input.release', () => input!.release())
    input = null
  }
  deviceId = ''
  deviceName = ''
}
