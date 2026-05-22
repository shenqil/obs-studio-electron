/**
 * 渲染进程 OBS 类型定义
 */

export type SourceType = 'camera' | 'screen' | 'window' | 'microphone'

export interface CameraDevice {
  id: string
  name: string
}

export interface SourceInfo {
  id: string
  name: string
  type: SourceType
  deviceId?: string
  visible: boolean
}

export interface RTMPConfig {
  server: string
  key: string
}

export type StreamState = 'idle' | 'connecting' | 'streaming' | 'error'

export interface OBSSignal {
  type: string
  code: number
  error?: string
}
