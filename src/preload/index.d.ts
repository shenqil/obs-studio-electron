import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  CameraDevice,
  MonitorDevice,
  WindowDevice,
  SourceInfo,
  RTMPConfig,
  StreamState,
  OBSSignal
} from '../shared/types'

export type {
  CameraDevice,
  MonitorDevice,
  WindowDevice,
  SourceInfo,
  RTMPConfig,
  StreamState,
  OBSSignal
}

// 预览边界类型
interface PreviewBounds {
  x: number
  y: number
  width: number
  height: number
}

// OBS API 接口
interface OBSAPI {
  // 摄像头
  getCameras: () => Promise<CameraDevice[]>
  addCamera: (deviceId: string) => Promise<string | null>

  // 显示器
  getMonitors: () => Promise<MonitorDevice[]>
  addMonitor: (monitorId: string) => Promise<string | null>

  // 窗口
  getWindows: () => Promise<WindowDevice[]>
  addWindow: (windowId: string, sourceName?: string) => Promise<string | null>

  // 源管理
  getSources: () => Promise<SourceInfo[]>
  removeSource: (sourceName: string) => Promise<boolean>
  setSourceVisible: (sourceName: string, visible: boolean) => Promise<boolean>
  moveSourceUp: (sourceName: string) => Promise<boolean>
  moveSourceDown: (sourceName: string) => Promise<boolean>

  // 推流
  setRTMPConfig: (config: RTMPConfig) => Promise<boolean>
  getRTMPConfig: () => Promise<RTMPConfig>
  startStreaming: () => Promise<boolean>
  stopStreaming: () => Promise<boolean>
  getStreamState: () => Promise<StreamState>

  // 事件监听
  onStreamStateChanged: (callback: (signal: OBSSignal) => void) => () => void

  // 预览
  setPreview: (bounds: PreviewBounds) => Promise<{ height: number } | null>
  resizePreview: (bounds: PreviewBounds) => Promise<{ height: number } | null>
  destroyPreview: () => Promise<boolean>
  setShouldDrawUI: (drawUI: boolean) => Promise<void>
  setDrawGuideLines: (drawGuideLines: boolean) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      obs: OBSAPI
    }
  }
}
