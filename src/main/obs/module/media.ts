/**
 * [module] 本地视频（媒体源）
 *
 * 职责：创建 ffmpeg_source 输入源，用于播放本地视频文件；
 * 并封装对单个媒体输入源的播放控制（播放/暂停/重启/停止/进度/循环）与状态读取。
 * 音量不在此管理：由 fader 模块按场景项 id 持有 Fader 统一负责。
 *
 * 仅操作传入的 IInput，不感知场景，也不负责加入场景（由 api 层组装）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { tryRun, tryGet } from '../common/safe'
import { MEDIA_SOURCE_TYPE, SOURCE_NAME_PREFIX, MONITORING_TYPE } from '../common/constants'
import type { CreateSourceParams, MediaStatus } from '../../../shared/types'

const log = createLogger('media')

/**
 * 创建本地视频输入源。
 *
 * params.id 为本地文件绝对路径。
 * 只写视频相关 settings；name/label/type 由 api 层写入本地缓存（sourceStore），不入 OBS settings。
 * @returns 创建的输入源
 */
export function createInput(params: CreateSourceParams): osn.IInput {
  const sourceName = `${SOURCE_NAME_PREFIX.media}${Date.now()}`

  log.debug('Creating media input:', { sourceName, filePath: params.id, type: MEDIA_SOURCE_TYPE })
  // create 时已传入完整 settings（is_local_file/local_file/looping），
  // 旧实现紧接着把 settings 原样 update+save 没有语义价值，已移除。
  const input = osn.InputFactory.create(MEDIA_SOURCE_TYPE, sourceName, {
    is_local_file: true,
    local_file: params.id,
    looping: true
  })

  log.info('Media input created:', sourceName)
  return input
}

// ============================================================================
// 播放控制（作用于单个媒体输入源）
// ============================================================================

/** 播放 */
export function play(input: osn.IInput): void {
  tryRun('media.play', () => input.play(), log)
}

/** 暂停 */
export function pause(input: osn.IInput): void {
  tryRun('media.pause', () => input.pause(), log)
}

/** 重新开始（从头播放） */
export function restart(input: osn.IInput): void {
  tryRun('media.restart', () => input.restart(), log)
}

/** 停止 */
export function stop(input: osn.IInput): void {
  tryRun('media.stop', () => input.stop(), log)
}

/**
 * 跳转到指定播放位置。
 * @param ms 目标位置（毫秒），会被夹在 [0, duration] 内
 */
export function seek(input: osn.IInput, ms: number): void {
  const duration = safeDuration(input)
  const target = duration > 0 ? Math.max(0, Math.min(ms, duration)) : Math.max(0, ms)
  tryRun(
    'media.seek',
    () => {
      input.seek = target
    },
    log
  )
}

/**
 * 设置是否循环播放。
 * looping 是 ffmpeg_source 的 settings 字段，更新后 update + save 落盘。
 */
export function setLooping(input: osn.IInput, looping: boolean): void {
  tryRun(
    'media.setLooping',
    () => {
      const settings = input.settings
      settings.looping = looping
      input.update(settings)
      input.save()
    },
    log
  )
}

/**
 * 设置本地监听（回放）开关。
 *   enabled=true  -> MonitoringAndOutput：本地有声 + 推流有声。
 *   enabled=false -> None：仅输出（本地无声、推流有声），即默认行为。
 */
export function setMonitoring(input: osn.IInput, enabled: boolean): void {
  tryRun(
    'media.setMonitoring',
    () => {
      input.monitoringType = enabled ? MONITORING_TYPE.monitorAndOutput : MONITORING_TYPE.none
    },
    log
  )
}

/**
 * 读取媒体源的状态快照。
 * duration/seek 在某些状态（未加载/已停止）下可能抛错或返回非法值，统一兜底。
 * 不再上报播放态：UI 依据 currentTime 是否推进自行判断播放/停止。
 *
 * 音量不在本模块管理（由 fader 模块按 id 持有），故 volume 由 api 层从 fader 读出后传入。
 *
 * @param volume 当前音量（0..1），由 api 层从 fader 模块取得
 */
export function getStatus(input: osn.IInput, itemId: number, volume: number): MediaStatus {
  return {
    itemId,
    duration: safeDuration(input),
    currentTime: safeSeek(input),
    volume: Math.max(0, Math.min(volume, 1)),
    looping: safeLooping(input),
    monitoring: safeMonitoring(input)
  }
}

function safeDuration(input: osn.IInput): number {
  const d = tryGet('media.getDuration', () => input.getDuration(), 0, log)
  return Number.isFinite(d) && d > 0 ? d : 0
}

function safeSeek(input: osn.IInput): number {
  const s = tryGet('media.getSeek', () => input.seek, 0, log)
  return Number.isFinite(s) && s >= 0 ? s : 0
}

function safeLooping(input: osn.IInput): boolean {
  return tryGet('media.getLooping', () => Boolean(input.settings?.looping), false, log)
}

/** 本地监听是否开启：monitoringType 非 None（0）即视为开启。 */
function safeMonitoring(input: osn.IInput): boolean {
  return tryGet('media.getMonitoring', () => Number(input.monitoringType) !== 0, false, log)
}
