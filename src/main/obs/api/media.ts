/**
 * [api] 媒体（本地视频）播放控制
 *
 * 组装「按场景项 id 找到底层 IInput -> 调用 media 模块的播放控制」流程，
 * 并维护一个「选中媒体源时」的进度轮询：
 *   - 监听 selection:changed，选中项为媒体源则启动定时器周期性 emit media:progress；
 *   - 选中项非媒体 / 无选中 / 源被删时停止轮询并 emit 一次 null，让 UI 收起媒体控制条。
 *
 * 进度推送只在「有媒体源被选中」时进行，避免常驻定时器与无谓 IPC。
 */
import { media, fader, scene } from '../module'
import { obsEvents } from '../common/events'
import { createLogger } from '../common/logger'
import * as sourceStore from '../common/sourceStore'
import type * as osn from '@shen9401/obs-studio-node'
import type { MediaStatus } from '../../../shared/types'

const log = createLogger('api:media')

/** 进度推送间隔（毫秒） */
const PROGRESS_INTERVAL_MS = 500

let progressTimer: ReturnType<typeof setInterval> | null = null
/** 当前正在推送进度的媒体场景项 id */
let trackingItemId: number | null = null

/** 判断某场景项是否为媒体源（读本地元数据缓存，零跨进程 IPC）。 */
function isMediaItem(itemId: number): boolean {
  const input = scene.findInputById(itemId)
  if (!input) {
    return false
  }
  return sourceStore.get(input.name)?.type === 'media'
}

/** 读取指定媒体场景项的状态快照，找不到源返回 null。 */
function readStatus(itemId: number): MediaStatus | null {
  const input = scene.findInputById(itemId)
  if (!input) {
    return null
  }
  // 音量从 fader 模块按 id 读取（统一在 fader 管理）
  return media.getStatus(input, itemId, fader.getVolume(itemId))
}

// ============================================================================
// 播放控制
// ============================================================================

/** 对指定媒体场景项执行操作，找不到底层源返回 false。 */
function withInput(itemId: number, action: (input: osn.IInput) => void): boolean {
  const input = scene.findInputById(itemId)
  if (!input) {
    log.warn('media op: input not found for item', itemId)
    return false
  }
  action(input)
  return true
}

export function play(itemId: number): boolean {
  log.info('media play:', itemId)
  const ok = withInput(itemId, (input) => media.play(input))
  pushProgressOnce(itemId)
  return ok
}

export function pause(itemId: number): boolean {
  log.info('media pause:', itemId)
  const ok = withInput(itemId, (input) => media.pause(input))
  pushProgressOnce(itemId)
  return ok
}

export function restart(itemId: number): boolean {
  log.info('media restart:', itemId)
  const ok = withInput(itemId, (input) => media.restart(input))
  pushProgressOnce(itemId)
  return ok
}

export function stop(itemId: number): boolean {
  log.info('media stop:', itemId)
  const ok = withInput(itemId, (input) => media.stop(input))
  pushProgressOnce(itemId)
  return ok
}

export function seek(itemId: number, ms: number): boolean {
  const ok = withInput(itemId, (input) => media.seek(input, ms))
  pushProgressOnce(itemId)
  return ok
}

export function setVolume(itemId: number, volume: number): boolean {
  // 音量统一走 fader 模块（按场景项 id）
  const ok = fader.setVolume(itemId, volume)
  pushProgressOnce(itemId)
  return ok
}

export function setLooping(itemId: number, looping: boolean): boolean {
  log.info('media setLooping:', itemId, looping)
  const ok = withInput(itemId, (input) => media.setLooping(input, looping))
  pushProgressOnce(itemId)
  return ok
}

export function setMonitoring(itemId: number, enabled: boolean): boolean {
  log.info('media setMonitoring:', itemId, enabled)
  const ok = withInput(itemId, (input) => media.setMonitoring(input, enabled))
  pushProgressOnce(itemId)
  return ok
}

/** 主动查询某媒体源状态（UI 初次进入媒体控制时拉取）。 */
export function getStatus(itemId: number): MediaStatus | null {
  return readStatus(itemId)
}

// ============================================================================
// 进度推送（随选中变化启停）
// ============================================================================

/** 立即推送一次指定项的进度（仍是媒体源时）。 */
function pushProgressOnce(itemId: number): void {
  if (trackingItemId !== itemId) {
    return
  }
  obsEvents.emit('media:progress', readStatus(itemId))
}

function startTracking(itemId: number): void {
  stopTracking()
  trackingItemId = itemId
  log.debug('Start media progress tracking:', itemId)
  // 立即推一次，避免等待首个间隔
  obsEvents.emit('media:progress', readStatus(itemId))
  progressTimer = setInterval(() => {
    if (trackingItemId == null) {
      return
    }
    const status = readStatus(trackingItemId)
    // 源已不存在（被删除等）：停止轮询并通知 UI 收起
    if (!status) {
      stopTracking()
      obsEvents.emit('media:progress', null)
      return
    }
    obsEvents.emit('media:progress', status)
  }, PROGRESS_INTERVAL_MS)
}

function stopTracking(): void {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  trackingItemId = null
}

/**
 * 根据当前选中项决定是否推送媒体进度。
 * 选中媒体源 -> 启动轮询；否则停止并通知 UI 收起（emit null）。
 */
function syncTrackingToSelection(selectedId: number | null): void {
  if (selectedId != null && isMediaItem(selectedId)) {
    if (trackingItemId !== selectedId) {
      startTracking(selectedId)
    }
    return
  }
  if (trackingItemId != null) {
    stopTracking()
    obsEvents.emit('media:progress', null)
  }
}

// ============================================================================
// 事件驱动生命周期（依赖有序，无互锁）
// ============================================================================
//
// init：媒体进度跟踪依赖 scene（按场景项 id 找 IInput / 读元数据）。监听 scene:initialized，
//       建立选中监听后发出 media:initialized。
// destroy：媒体只负责停止自己的进度轮询与选中监听；Fader 的释放已移交 source 层
//       （source 是源附属资源的统一编排/销毁者）。媒体收尾不依赖源存活，
//       监听根触发 lifecycle:destroy 立即收尾，用 try/finally 保证 media:destroyed 无条件
//       发出（scene 的销毁 onAll 在等它）。

/** 选中监听的取消函数，init 时建立、destroy 时取消。 */
let selectionUnsub: (() => void) | null = null

/** scene 就绪后：开始监听选中变化以驱动进度推送。 */
function onSceneInitialized(): void {
  if (!selectionUnsub) {
    log.debug('media: start selection tracking on scene:initialized')
    selectionUnsub = obsEvents.on('selection:changed', (selectedId) => {
      syncTrackingToSelection(selectedId)
    })
  }
  obsEvents.emit('media:initialized')
}

/** 销毁触发：停定时器、取消选中监听（Fader 释放由 source 层统一处理）。 */
function onLifecycleDestroy(): void {
  try {
    log.debug('media: stop selection tracking on lifecycle:destroy')
    stopTracking()
    selectionUnsub?.()
    selectionUnsub = null
  } finally {
    // 无条件发出，避免 scene 的销毁 onAll 永久挂起
    obsEvents.emit('media:destroyed')
  }
}

// 通过事件总线（common 层）订阅生命周期，避免 api 之间相互 import。
// 模块加载时即订阅；obsEvents 为全局单例，订阅常驻、跨多次 init/destroy 循环有效。
obsEvents.on('scene:initialized', onSceneInitialized)
obsEvents.on('lifecycle:destroy', onLifecycleDestroy)
