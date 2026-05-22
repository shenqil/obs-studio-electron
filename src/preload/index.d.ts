import { ElectronAPI } from '@electron-toolkit/preload'
import type { CameraDevice, SourceInfo, RTMPConfig, StreamState, OBSSignal } from '../shared/types'

export type { CameraDevice, SourceInfo, RTMPConfig, StreamState, OBSSignal }

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
