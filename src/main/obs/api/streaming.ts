/**
 * [api] 推流
 *
 * 复用 streaming 模块能力作为对外编排出口，并负责推流的销毁编排。
 * 状态机（依据 output:signal 推进）内聚在 streaming 模块；本层只做能力透传 + 生命周期。
 */
import { streaming } from '../module'
import { obsEvents } from '../common/events'
import type { RTMPConfig, StreamState } from '../../../shared/types'

/** 配置 RTMP */
export function setRTMPConfig(config: RTMPConfig): void {
  streaming.setConfig(config)
}

/** 获取 RTMP 配置 */
export function getRTMPConfig(): RTMPConfig {
  return streaming.getConfig()
}

/** 开始推流 */
export function startStreaming(): boolean {
  return streaming.start()
}

/** 停止推流 */
export function stopStreaming(): boolean {
  return streaming.stop()
}

/** 获取推流状态 */
export function getStreamState(): StreamState {
  return streaming.getState()
}

// ============================================================================
// 事件驱动生命周期（依赖有序，无互锁）
// ============================================================================
//
// init：推流无初始化依赖（配置惰性写入），不参与 init 链。
// destroy：推流输出持有 video canvas，必须在 core 销毁 videoContext 之前停掉。监听根触发
//       lifecycle:destroy 立即 forceStop，用 try/finally 保证 streaming:destroyed 无条件发出
//       （core 的销毁 onAll 在等它）。

obsEvents.on('lifecycle:destroy', () => {
  try {
    streaming.forceStop()
  } finally {
    obsEvents.emit('streaming:destroyed')
  }
})
