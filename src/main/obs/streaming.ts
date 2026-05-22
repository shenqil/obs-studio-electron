/**
 * RTMP 推流管理模块
 */
import * as osn from '@shen9401/obs-studio-node'
import { isOBSInitialized } from './core'
import { setSetting, getSetting } from './obs_utils'
import type { RTMPConfig, StreamState } from './types'

// 推流状态
let currentStreamState: StreamState = 'idle'

/**
 * 配置 RTMP
 */
export function setRTMPConfig(config: RTMPConfig): boolean {
  console.log('set streamkey')
  setSetting('Stream', 'streamType', 'rtmp_custom')
  setSetting('Stream', 'server', config.server)
  setSetting('Stream', 'key', config.key)
  console.debug('RTMP config set:', config.server)
  return true
}

/**
 * 获取 RTMP 配置
 */
export function getRTMPConfig(): RTMPConfig {
  return {
    server: (getSetting('Stream', 'server') as string) || '',
    key: (getSetting('Stream', 'key') as string) || ''
  }
}

/**
 * 开始推流
 */
export function startStreaming(): boolean {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return false
  }

  if (currentStreamState === 'streaming' || currentStreamState === 'connecting') {
    console.warn('Already streaming or connecting')
    return false
  }

  try {
    currentStreamState = 'connecting'
    osn.NodeObs.OBS_service_startStreaming()
    currentStreamState = 'streaming'
    console.debug('Streaming started')
    return true
  } catch (error) {
    console.error('Failed to start streaming:', error)
    currentStreamState = 'error'
    return false
  }
}

/**
 * 停止推流
 */
export function stopStreaming(): boolean {
  if (currentStreamState !== 'streaming') {
    console.warn('Not streaming')
    return false
  }

  try {
    osn.NodeObs.OBS_service_stopStreaming(false)
    currentStreamState = 'idle'
    console.debug('Streaming stopped')
    return true
  } catch (error) {
    console.error('Failed to stop streaming:', error)
    currentStreamState = 'error'
    return false
  }
}

/**
 * 获取当前推流状态
 */
export function getStreamState(): StreamState {
  return currentStreamState
}
