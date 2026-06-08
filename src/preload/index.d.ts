import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  CameraDevice,
  MonitorDevice,
  WindowDevice,
  MicrophoneDevice,
  DeviceInfo,
  CreateSourceParams,
  Vec2,
  SourceInfo,
  RTMPConfig,
  StreamState,
  OBSSignal,
  PreviewMouseEvent,
  PreviewCursor,
  MediaStatus
} from '../shared/types'
import { SourceMoveDirection } from '../shared/types'

export type {
  CameraDevice,
  MonitorDevice,
  WindowDevice,
  MicrophoneDevice,
  DeviceInfo,
  CreateSourceParams,
  Vec2,
  SourceInfo,
  RTMPConfig,
  StreamState,
  OBSSignal,
  PreviewMouseEvent,
  PreviewCursor,
  MediaStatus
}
export { SourceMoveDirection }

interface PreviewBounds {
  x: number
  y: number
  width: number
  height: number
}

interface OBSAPI {
  // OBS 状态
  isReady: () => Promise<boolean>
  onReady: (callback: () => void) => () => void

  // 摄像头
  getCameras: () => Promise<CameraDevice[]>
  addCamera: (params: CreateSourceParams) => Promise<number | null>

  // 显示器
  getMonitors: () => Promise<MonitorDevice[]>
  addMonitor: (params: CreateSourceParams) => Promise<number | null>

  // 窗口
  getWindows: () => Promise<WindowDevice[]>
  addWindow: (params: CreateSourceParams) => Promise<number | null>

  // 麦克风
  getMicrophones: () => Promise<MicrophoneDevice[]>
  addMicrophone: (params: CreateSourceParams) => Promise<number | null>
  setMicVolume: (id: number, volume: number) => Promise<boolean>
  getMicVolume: (id: number) => Promise<number>
  switchMicDevice: (id: number, deviceId: string) => Promise<boolean>

  // 本地视频（媒体源）
  addMedia: (params: CreateSourceParams) => Promise<number | null>
  mediaPlay: (id: number) => Promise<boolean>
  mediaPause: (id: number) => Promise<boolean>
  mediaRestart: (id: number) => Promise<boolean>
  mediaStop: (id: number) => Promise<boolean>
  mediaSeek: (id: number, ms: number) => Promise<boolean>
  mediaSetVolume: (id: number, volume: number) => Promise<boolean>
  mediaSetLooping: (id: number, looping: boolean) => Promise<boolean>
  mediaSetMonitoring: (id: number, enabled: boolean) => Promise<boolean>
  getMediaStatus: (id: number) => Promise<MediaStatus | null>
  onMediaProgress: (callback: (status: MediaStatus | null) => void) => () => void

  // 源管理（统一以场景项 id 为键）
  getSources: () => Promise<SourceInfo[]>
  removeSource: (id: number) => Promise<boolean>
  setSourceVisible: (id: number, visible: boolean) => Promise<boolean>
  setSourceMuted: (id: number, muted: boolean) => Promise<boolean>
  moveSource: (id: number, direction: SourceMoveDirection) => Promise<boolean>
  selectSource: (id: number) => Promise<boolean>
  clearSourceSelection: () => Promise<void>
  onSourcesChanged: (callback: (sources: SourceInfo[]) => void) => () => void
  onSelectionChanged: (callback: (selectedId: number | null) => void) => () => void

  // 推流
  setRTMPConfig: (config: RTMPConfig) => Promise<void>
  getRTMPConfig: () => Promise<RTMPConfig>
  startStreaming: () => Promise<boolean>
  stopStreaming: () => Promise<boolean>
  getStreamState: () => Promise<StreamState>

  // 事件监听
  onStreamStateChanged: (callback: (state: StreamState) => void) => () => void

  // 预览
  setupPreview: (bounds: PreviewBounds) => Promise<{ height: number } | null>
  resizePreview: (bounds: PreviewBounds) => Promise<{ height: number }>
  destroyPreview: () => Promise<void>
  sendPreviewMouseEvent: (event: PreviewMouseEvent) => void
  onPreviewCursorChanged: (callback: (cursor: PreviewCursor) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      obs: OBSAPI
    }
  }
}
