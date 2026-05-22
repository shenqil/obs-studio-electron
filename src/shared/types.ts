/**
 * OBS 相关类型定义
 * 主进程和渲染进程共享
 */

// 源类型
export type SourceType = 'camera' | 'monitor' | 'screen' | 'window' | 'microphone'

// 摄像头设备信息
export interface CameraDevice {
  id: string
  name: string
}

// 显示器设备信息
export interface MonitorDevice {
  id: string
  name: string
}

// 源信息
export interface SourceInfo {
  id: string
  name: string
  sourceName: string
  type: SourceType
  visible: boolean
}

// RTMP 配置
export interface RTMPConfig {
  server: string
  key: string
}

// 流状态
export type StreamState = 'idle' | 'connecting' | 'streaming' | 'error'

// OBS 信号类型
export interface OBSSignal {
  type: string
  code: number
  error?: string
}

// IPC 通道名称
export const IPC_CHANNELS = {
  // 摄像头
  GET_CAMERAS: 'obs:getCameras',
  ADD_CAMERA: 'obs:addCamera',

  // 显示器
  GET_MONITORS: 'obs:getMonitors',
  ADD_MONITOR: 'obs:addMonitor',

  // 源管理
  GET_SOURCES: 'obs:getSources',
  REMOVE_SOURCE: 'obs:removeSource',
  SET_SOURCE_VISIBLE: 'obs:setSourceVisible',

  // 推流
  SET_RTMP_CONFIG: 'obs:setRTMPConfig',
  GET_RTMP_CONFIG: 'obs:getRTMPConfig',
  START_STREAMING: 'obs:startStreaming',
  STOP_STREAMING: 'obs:stopStreaming',
  GET_STREAM_STATE: 'obs:getStreamState',

  // 预览
  SET_PREVIEW: 'obs:setPreview',

  // 事件
  STREAM_STATE_CHANGED: 'obs:streamStateChanged',
  SOURCE_ADDED: 'obs:sourceAdded',
  SOURCE_REMOVED: 'obs:sourceRemoved'
} as const
