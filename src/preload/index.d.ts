import { ElectronAPI } from '@electron-toolkit/preload'

// OBS 相关类型
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

// OBS API 接口
interface OBSAPI {
  // 摄像头
  getCameras: () => Promise<CameraDevice[]>
  addCamera: (deviceId: string) => Promise<string | null>
  removeSource: (sourceName: string) => Promise<boolean>
  getSources: () => Promise<SourceInfo[]>
  setSourceVisible: (sourceName: string, visible: boolean) => Promise<boolean>

  // 推流
  setRTMPConfig: (config: RTMPConfig) => Promise<boolean>
  getRTMPConfig: () => Promise<RTMPConfig>
  startStreaming: () => Promise<boolean>
  stopStreaming: () => Promise<boolean>
  getStreamState: () => Promise<StreamState>

  // 事件监听
  onStreamStateChanged: (callback: (signal: OBSSignal) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      obs: OBSAPI
    }
  }
}
