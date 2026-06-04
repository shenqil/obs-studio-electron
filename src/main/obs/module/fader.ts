/**
 * [module] 音量推子（Fader）
 *
 * 职责：以「场景项 id」为键，为需要音量控制的源维护各自的 OBS Fader 实例，
 * 并提供按 id 设置 / 读取音量的统一入口。
 *
 * 说明：
 *   - OBS 的 input.volume 是线性增益倍率（mul，1.0=0dB，可 >1），并非「0~100% 音量」；
 *     与 OBS 音量条一致的百分比是 Cubic Fader 的 deflection（0..1）。
 *   - Fader 是独立控件，attach 到源后读写 deflection 会同步该源的 volume 倍率；
 *     osn 无法从 input 反向取回 Fader，故由本模块按 id 持有、复用、释放。
 *   - 仅操作传入的 IInput，不感知场景（由 api 层在加源/删源时调用 create/release）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { FADER_TYPE_CUBIC } from '../common/constants'

const log = createLogger('fader')

/** key = 场景项 id，value = 该源的 Cubic Fader 实例 */
const faders = new Map<number, osn.IFader>()

/**
 * 为指定场景项创建并 attach 一个 Fader（已存在则复用）。
 * @param id 场景项 id
 * @param input 该场景项的底层输入源
 */
export function create(id: number, input: osn.IInput): osn.IFader {
  const existing = faders.get(id)
  if (existing) {
    return existing
  }
  log.debug('Creating fader for item:', id)
  const fader = osn.FaderFactory.create(FADER_TYPE_CUBIC)
  fader.attach(input)
  faders.set(id, fader)
  return fader
}

/**
 * 设置音量。
 * @param id 场景项 id
 * @param volume 音量（0..1 的 deflection），会被夹在 [0, 1] 内
 * @returns 是否设置成功（无对应 Fader 返回 false）
 */
export function setVolume(id: number, volume: number): boolean {
  const fader = faders.get(id)
  if (!fader) {
    log.warn('setVolume: fader not found for item:', id)
    return false
  }
  fader.deflection = Math.max(0, Math.min(volume, 1))
  return true
}

/**
 * 读取音量（0..1 的 deflection），无对应 Fader 或读取异常时返回兜底值 1。
 * @param id 场景项 id
 */
export function getVolume(id: number): number {
  const fader = faders.get(id)
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

/** 是否存在指定场景项的 Fader。 */
export function has(id: number): boolean {
  return faders.has(id)
}

/**
 * 释放指定场景项的 Fader（删源时调用）。
 */
export function release(id: number): void {
  const fader = faders.get(id)
  if (!fader) {
    return
  }
  log.debug('Releasing fader for item:', id)
  try {
    fader.detach()
  } catch {
    // ignore detach errors
  }
  fader.destroy()
  faders.delete(id)
}

/**
 * 释放全部 Fader（销毁场景 / OBS 销毁时调用）。
 */
export function releaseAll(): void {
  log.debug('Releasing all faders, count:', faders.size)
  for (const fader of faders.values()) {
    try {
      fader.detach()
    } catch {
      // ignore detach errors
    }
    fader.destroy()
  }
  faders.clear()
}
