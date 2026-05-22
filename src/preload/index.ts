import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  CameraDevice,
  MonitorDevice,
  WindowDevice,
  SourceInfo,
  RTMPConfig,
  OBSSignal,
  StreamState
} from '../shared/types'

// IPC 通道名称
const IPC_CHANNELS = {
  GET_CAMERAS: 'obs:getCameras',
  ADD_CAMERA: 'obs:addCamera',
  GET_MONITORS: 'obs:getMonitors',
  ADD_MONITOR: 'obs:addMonitor',
  GET_WINDOWS: 'obs:getWindows',
  ADD_WINDOW: 'obs:addWindow',
  GET_SOURCES: 'obs:getSources',
  REMOVE_SOURCE: 'obs:removeSource',
  SET_SOURCE_VISIBLE: 'obs:setSourceVisible',
  MOVE_SOURCE_UP: 'obs:moveSourceUp',
  MOVE_SOURCE_DOWN: 'obs:moveSourceDown',
  SET_RTMP_CONFIG: 'obs:setRTMPConfig',
  GET_RTMP_CONFIG: 'obs:getRTMPConfig',
  START_STREAMING: 'obs:startStreaming',
  STOP_STREAMING: 'obs:stopStreaming',
  GET_STREAM_STATE: 'obs:getStreamState',
  STREAM_STATE_CHANGED: 'obs:streamStateChanged',
  SET_PREVIEW: 'obs:setPreview',
  RESIZE_PREVIEW: 'obs:resizePreview',
  DESTROY_PREVIEW: 'obs:destroyPreview',
  SET_SHOULD_DRAW_UI: 'obs:setShouldDrawUI',
  SET_DRAW_GUIDE_LINES: 'obs:setDrawGuideLines'
} as const

// 预览边界类型
interface PreviewBounds {
  x: number
  y: number
  width: number
  height: number
}

// OBS API 接口
interface OBSAPI {
  getCameras: () => Promise<CameraDevice[]>
  addCamera: (deviceId: string) => Promise<string | null>
  getMonitors: () => Promise<MonitorDevice[]>
  addMonitor: (monitorId: string) => Promise<string | null>
  getWindows: () => Promise<WindowDevice[]>
  addWindow: (windowId: string, sourceName?: string) => Promise<string | null>
  getSources: () => Promise<SourceInfo[]>
  removeSource: (sourceName: string) => Promise<boolean>
  setSourceVisible: (sourceName: string, visible: boolean) => Promise<boolean>
  moveSourceUp: (sourceName: string) => Promise<boolean>
  moveSourceDown: (sourceName: string) => Promise<boolean>
  setRTMPConfig: (config: RTMPConfig) => Promise<boolean>
  getRTMPConfig: () => Promise<RTMPConfig>
  startStreaming: () => Promise<boolean>
  stopStreaming: () => Promise<boolean>
  getStreamState: () => Promise<StreamState>
  onStreamStateChanged: (callback: (signal: OBSSignal) => void) => () => void
  // 预览相关
  setPreview: (bounds: PreviewBounds) => Promise<{ height: number } | null>
  resizePreview: (bounds: PreviewBounds) => Promise<{ height: number } | null>
  destroyPreview: () => Promise<boolean>
  setShouldDrawUI: (drawUI: boolean) => Promise<void>
  setDrawGuideLines: (drawGuideLines: boolean) => Promise<void>
}

const api: { obs: OBSAPI } = {
  obs: {
    getCameras: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CAMERAS),
    addCamera: (deviceId: string) => ipcRenderer.invoke(IPC_CHANNELS.ADD_CAMERA, deviceId),
    getMonitors: () => ipcRenderer.invoke(IPC_CHANNELS.GET_MONITORS),
    addMonitor: (monitorId: string) => ipcRenderer.invoke(IPC_CHANNELS.ADD_MONITOR, monitorId),
    getWindows: () => ipcRenderer.invoke(IPC_CHANNELS.GET_WINDOWS),
    addWindow: (windowId: string, sourceName?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ADD_WINDOW, windowId, sourceName),
    getSources: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SOURCES),
    removeSource: (sourceName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.REMOVE_SOURCE, sourceName),
    setSourceVisible: (sourceName: string, visible: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_SOURCE_VISIBLE, sourceName, visible),
    moveSourceUp: (sourceName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MOVE_SOURCE_UP, sourceName),
    moveSourceDown: (sourceName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MOVE_SOURCE_DOWN, sourceName),
    setRTMPConfig: (config: RTMPConfig) => ipcRenderer.invoke(IPC_CHANNELS.SET_RTMP_CONFIG, config),
    getRTMPConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_RTMP_CONFIG),
    startStreaming: () => ipcRenderer.invoke(IPC_CHANNELS.START_STREAMING),
    stopStreaming: () => ipcRenderer.invoke(IPC_CHANNELS.STOP_STREAMING),
    getStreamState: () => ipcRenderer.invoke(IPC_CHANNELS.GET_STREAM_STATE),
    onStreamStateChanged: (callback: (signal: OBSSignal) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, signal: OBSSignal): void => {
        callback(signal)
      }
      ipcRenderer.on(IPC_CHANNELS.STREAM_STATE_CHANGED, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.STREAM_STATE_CHANGED, handler)
      }
    },
    // 预览相关
    setPreview: (bounds: PreviewBounds) => ipcRenderer.invoke(IPC_CHANNELS.SET_PREVIEW, bounds),
    resizePreview: (bounds: PreviewBounds) =>
      ipcRenderer.invoke(IPC_CHANNELS.RESIZE_PREVIEW, bounds),
    destroyPreview: () => ipcRenderer.invoke(IPC_CHANNELS.DESTROY_PREVIEW),
    setShouldDrawUI: (drawUI: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_SHOULD_DRAW_UI, drawUI),
    setDrawGuideLines: (drawGuideLines: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_DRAW_GUIDE_LINES, drawGuideLines)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.electron = electronAPI
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.api = api
}
