/**
 * [module] 推流
 *
 * 职责：RTMP 配置读写、开始/停止推流、维护推流状态。
 *
 * 状态来源（关键）：推流是异步过程，真实状态由 OBS 输出信号驱动，而非 start()/stop()
 * 调用本身。本模块在加载时订阅 `output:signal`（仅 type=streaming），按 signal 名推进状态：
 *   start() -> connecting，随后底层依次回灌 starting/start(activate)/stop(deactivate) 等信号。
 *   连接失败 / 中断会带非 0 的 code 到达 stop，据此进入 error。
 * 状态变化通过事件总线 `stream:state` 广播，由 api/lifecycle 转发到渲染进程。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { obsEvents } from '../common/events'
import { setSetting, getSetting } from '../common/settings'
import { tryRun } from '../common/safe'
import {
  STREAM_SETTINGS,
  OUTPUT_TYPE_STREAMING,
  OUTPUT_SIGNAL,
  OUTPUT_CODE_SUCCESS
} from '../common/constants'
import type { RTMPConfig, StreamState, OBSSignal } from '../../../shared/types'

const log = createLogger('streaming')

let state: StreamState = 'idle'

function setState(next: StreamState): void {
  if (state === next) {
    return
  }
  log.debug(`Stream state: ${state} -> ${next}`)
  state = next
  obsEvents.emit('stream:state', next)
}

/** 获取当前推流状态 */
export function getState(): StreamState {
  return state
}

/**
 * 根据 OBS 输出信号推进推流状态机（仅处理 type=streaming 的信号）。
 * 这是推流状态的唯一真相来源。
 */
function onOutputSignal(signal: OBSSignal): void {
  if (signal.type !== OUTPUT_TYPE_STREAMING) {
    return
  }

  switch (signal.signal) {
    case OUTPUT_SIGNAL.starting:
    case OUTPUT_SIGNAL.reconnect:
      setState('connecting')
      break

    case OUTPUT_SIGNAL.start:
    case OUTPUT_SIGNAL.activate:
    case OUTPUT_SIGNAL.reconnectSuccess:
      setState('streaming')
      break

    case OUTPUT_SIGNAL.stop:
    case OUTPUT_SIGNAL.deactivate:
      // 非 0 code 表示连接失败 / 异常断开
      if (signal.code !== undefined && signal.code !== OUTPUT_CODE_SUCCESS) {
        log.warn(`Streaming stopped with error code ${signal.code}: ${signal.error ?? ''}`)
        setState('error')
      } else {
        setState('idle')
      }
      break

    // stopping 是过渡态，沿用当前 connecting/streaming 显示，等 stop 落定
    default:
      break
  }
}

// 模块加载即订阅；obsEvents 为全局单例，跨多次 init/destroy 循环常驻有效。
obsEvents.on('output:signal', onOutputSignal)

/**
 * 配置 RTMP 推流地址与串流密钥。
 */
export function setConfig(config: RTMPConfig): void {
  log.info('Setting RTMP config, server:', config.server)
  setSetting(STREAM_SETTINGS.category, STREAM_SETTINGS.typeField, STREAM_SETTINGS.type)
  setSetting(STREAM_SETTINGS.category, STREAM_SETTINGS.serverField, config.server)
  setSetting(STREAM_SETTINGS.category, STREAM_SETTINGS.keyField, config.key)
}

/**
 * 读取当前 RTMP 配置。
 */
export function getConfig(): RTMPConfig {
  return {
    server:
      (getSetting(STREAM_SETTINGS.category, STREAM_SETTINGS.serverField) as string) ||
      'rtmp://127.0.0.1:1935/live',
    key: (getSetting(STREAM_SETTINGS.category, STREAM_SETTINGS.keyField) as string) || 'test'
  }
}

/**
 * 开始推流。
 *
 * 只把状态置为 connecting 并触发底层开始；真正的 streaming / error 由输出信号回灌确定，
 * 不在此处乐观地直接置 streaming（旧实现的 bug：RTMP 还没连上就显示已推流，且失败永远不报错）。
 * @returns 是否成功发起（已在推流/连接中，或底层调用抛错则返回 false）
 */
export function start(): boolean {
  if (state === 'streaming' || state === 'connecting') {
    log.warn('Already streaming/connecting, skip start')
    return false
  }

  log.info('Starting streaming...')
  setState('connecting')
  const ok = tryRun('OBS_service_startStreaming', () => osn.NodeObs.OBS_service_startStreaming())
  if (!ok) {
    setState('error')
    return false
  }
  return true
}

/**
 * 停止推流。
 *
 * 触发底层停止；状态回落到 idle 由 stop/deactivate 信号确认。
 * @returns 是否成功发起停止
 */
export function stop(): boolean {
  if (state !== 'streaming' && state !== 'connecting') {
    log.warn('Not streaming, skip stop')
    return false
  }

  log.info('Stopping streaming...')
  const ok = tryRun('OBS_service_stopStreaming', () => osn.NodeObs.OBS_service_stopStreaming(false))
  if (!ok) {
    setState('error')
    return false
  }
  return true
}

/**
 * 强制停止推流（用于销毁流程）。
 *
 * 与 stop() 不同：无视当前状态都尝试强制停止，且传入 force=true。
 * 推流输出会一直持有 video canvas，必须在销毁 videoContext 之前停掉，
 * 否则 OBS 报 "[VIDEO_CANVAS] video is active, video reset is not possible"。
 * 销毁路径下信号可能不再回灌，故此处直接同步置 idle。
 */
export function forceStop(): void {
  if (state === 'idle') {
    return
  }
  log.info('Force stopping streaming for teardown...')
  tryRun('OBS_service_stopStreaming(force)', () => osn.NodeObs.OBS_service_stopStreaming(true))
  setState('idle')
}
