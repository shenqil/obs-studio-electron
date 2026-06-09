/**
 * [api] 扬声器（音频输出）—— 独立全局输出通道单例
 *
 * 扬声器不再是场景项，而是挂在独立全局输出通道的单例（见 module/speaker.ts）。
 * 因此它不进 source 列表、不参与 scene 的增删/销毁，由本文件独立编排：
 *   - 设备枚举 / 设置（创建/切换/复用）/ 音量 / 移除。
 *   - 每次状态变化 emit `speaker:changed`，由 api/lifecycle 转发到渲染进程（SPEAKER_CHANGED）。
 *   - 持有 input（macOS 还持有 video canvas），故须在 core 销毁 videoContext 之前释放：
 *     监听 lifecycle:destroy 释放并无条件 emit `speaker:destroyed`（core 的销毁 onAll 在等它）。
 */
import { core, speaker } from '../module'
import { obsEvents } from '../common/events'
import { createLogger } from '../common/logger'
import type { SpeakerDevice, SpeakerState } from '../../../shared/types'

const log = createLogger('api:speaker')

/** 广播扬声器最新状态（null 表示未创建）。 */
function emitSpeakerChanged(): void {
  obsEvents.emit('speaker:changed', speaker.getState())
}

/** 获取可用扬声器（音频输出）设备列表。 */
export function listSpeakers(): SpeakerDevice[] {
  if (!core.ensureReady('listSpeakers')) return []
  return speaker.listDevices()
}

/**
 * 设置扬声器设备：未创建则创建并挂到独立通道；已创建且设备不同则切换；相同则复用。
 * @returns 设置后的单例状态，未就绪返回 null
 */
export function setSpeaker(device: SpeakerDevice): SpeakerState | null {
  if (!core.ensureReady('setSpeaker')) return null
  log.info('Set speaker device:', device.name)
  const state = speaker.set(device)
  emitSpeakerChanged()
  return state
}

/** 设置扬声器音量（0..1 的 deflection）。 */
export function setSpeakerVolume(volume: number): boolean {
  if (!core.ensureReady('setSpeakerVolume')) return false
  const ok = speaker.setVolume(volume)
  if (ok) {
    emitSpeakerChanged()
  }
  return ok
}

/** 设置扬声器静音 / 取消静音。 */
export function setSpeakerMuted(muted: boolean): boolean {
  if (!core.ensureReady('setSpeakerMuted')) return false
  log.info(`Set speaker muted=${muted}`)
  const ok = speaker.setMuted(muted)
  if (ok) {
    emitSpeakerChanged()
  }
  return ok
}

/** 获取扬声器单例状态（未创建返回 null）。 */
export function getSpeakerState(): SpeakerState | null {
  if (!core.ensureReady('getSpeakerState')) return null
  return speaker.getState()
}

/** 移除扬声器（释放通道/源/推子）。 */
export function removeSpeaker(): boolean {
  if (!core.ensureReady('removeSpeaker')) return false
  log.info('Remove speaker')
  speaker.release()
  emitSpeakerChanged()
  return true
}

// ============================================================================
// 事件驱动生命周期（扬声器独立单例的销毁）
// ============================================================================
//
// 扬声器持有 input（macOS 还持有 video canvas），必须在 core 销毁 videoContext 之前释放。
// core 的销毁要等 scene:destroyed + streaming:destroyed；扬声器与 streaming/preview 同级，
// 都在 lifecycle:destroy 扇出阶段收尾。这里加入 speaker:destroyed 让 core 一并等待。
// 用 try/finally 保证无条件发出，避免 core 的 onAll 永久挂起。

function onLifecycleDestroy(): void {
  try {
    log.debug('speaker: release on lifecycle:destroy')
    speaker.release()
  } finally {
    obsEvents.emit('speaker:destroyed')
  }
}

obsEvents.on('lifecycle:destroy', onLifecycleDestroy)
