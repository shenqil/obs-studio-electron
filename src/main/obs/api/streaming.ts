/**
 * [api] 推流
 *
 * 直接复用 streaming 模块能力，作为对外编排出口统一暴露。
 */
import { streaming } from '../module'
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
