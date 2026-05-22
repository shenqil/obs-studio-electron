import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { CameraDevice, SourceInfo, RTMPConfig, OBSSignal, StreamState } from '../main/obs/types'

// IPC 通道名称（需要与 main 进程同步）
const IPC_CHANNELS = {
  GET_CAMERAS: 'obs:getCameras',
  ADD_CAMERA: 'obs:addCamera',
  REMOVE_SOURCE: 'obs:removeSource',
  GET_SOURCES: 'obs:getSources',
  SET_SOURCE_VISIBLE: 'obs:setSourceVisible',
  SET_RTMP_CONFIG: 'obs:setRTMPConfig',
  GET_RTMP_CONFIG: 'obs:getRTMPConfig',
  START_STREAMING: 'obs:startStreaming',
  STOP_STREAMING: 'obs:stopStreaming',
  GET_STREAM_STATE: 'obs:getStreamState',
  STREAM_STATE_CHANGED: 'obs:streamStateChanged',
} as const

// OBS API 接口定义
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

// Custom APIs for renderer
const api: { obs: OBSAPI } = {
  obs: {
    // 摄像头
    getCameras: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CAMERAS),
    addCamera: (deviceId: string) => ipcRenderer.invoke(IPC_CHANNELS.ADD_CAMERA, deviceId),
    removeSource: (sourceName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.REMOVE_SOURCE, sourceName),
    getSources: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SOURCES),
    setSourceVisible: (sourceName: string, visible: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_SOURCE_VISIBLE, sourceName, visible),

    // 推流
    setRTMPConfig: (config: RTMPConfig) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_RTMP_CONFIG, config),
    getRTMPConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_RTMP_CONFIG),
    startStreaming: () => ipcRenderer.invoke(IPC_CHANNELS.START_STREAMING),
    stopStreaming: () => ipcRenderer.invoke(IPC_CHANNELS.STOP_STREAMING),
    getStreamState: () => ipcRenderer.invoke(IPC_CHANNELS.GET_STREAM_STATE),

    // 事件监听
    onStreamStateChanged: (callback: (signal: OBSSignal) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, signal: OBSSignal): void => {
        callback(signal)
      }
      ipcRenderer.on(IPC_CHANNELS.STREAM_STATE_CHANGED, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.STREAM_STATE_CHANGED, handler)
      }
    },
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
