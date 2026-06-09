import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  CameraDevice,
  MonitorDevice,
  WindowDevice,
  MicrophoneDevice,
  SpeakerDevice,
  SpeakerState,
  SourceInfo,
  CreateSourceParams,
  RTMPConfig,
  StreamState,
  PreviewMouseEvent,
  PreviewCursor,
  MediaStatus
} from '../shared/types'
import { IPC_CHANNELS, SourceMoveDirection } from '../shared/types'

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
  switchSourceDevice: (id: number, params: CreateSourceParams) => Promise<boolean>

  // 扬声器（音频输出，独立通道单例）
  getSpeakers: () => Promise<SpeakerDevice[]>
  setSpeaker: (device: SpeakerDevice) => Promise<SpeakerState | null>
  removeSpeaker: () => Promise<boolean>
  setSpeakerVolume: (volume: number) => Promise<boolean>
  setSpeakerMuted: (muted: boolean) => Promise<boolean>
  getSpeakerState: () => Promise<SpeakerState | null>
  onSpeakerChanged: (callback: (state: SpeakerState | null) => void) => () => void

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

const api: { obs: OBSAPI } = {
  obs: {
    isReady: () => ipcRenderer.invoke(IPC_CHANNELS.IS_OBS_READY),
    onReady: (callback: () => void) => {
      const handler = (): void => callback()
      ipcRenderer.on(IPC_CHANNELS.OBS_READY, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.OBS_READY, handler)
    },

    getCameras: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CAMERAS),
    addCamera: (params: CreateSourceParams) => ipcRenderer.invoke(IPC_CHANNELS.ADD_CAMERA, params),
    getMonitors: () => ipcRenderer.invoke(IPC_CHANNELS.GET_MONITORS),
    addMonitor: (params: CreateSourceParams) =>
      ipcRenderer.invoke(IPC_CHANNELS.ADD_MONITOR, params),
    getWindows: () => ipcRenderer.invoke(IPC_CHANNELS.GET_WINDOWS),
    addWindow: (params: CreateSourceParams) => ipcRenderer.invoke(IPC_CHANNELS.ADD_WINDOW, params),
    getMicrophones: () => ipcRenderer.invoke(IPC_CHANNELS.GET_MICROPHONES),
    addMicrophone: (params: CreateSourceParams) =>
      ipcRenderer.invoke(IPC_CHANNELS.ADD_MICROPHONE, params),
    setMicVolume: (id: number, volume: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_MIC_VOLUME, id, volume),
    getMicVolume: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.GET_MIC_VOLUME, id),
    switchSourceDevice: (id: number, params: CreateSourceParams) =>
      ipcRenderer.invoke(IPC_CHANNELS.SWITCH_SOURCE_DEVICE, id, params),
    getSpeakers: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SPEAKERS),
    setSpeaker: (device: SpeakerDevice) => ipcRenderer.invoke(IPC_CHANNELS.SET_SPEAKER, device),
    removeSpeaker: () => ipcRenderer.invoke(IPC_CHANNELS.REMOVE_SPEAKER),
    setSpeakerVolume: (volume: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_SPEAKER_VOLUME, volume),
    setSpeakerMuted: (muted: boolean) => ipcRenderer.invoke(IPC_CHANNELS.SET_SPEAKER_MUTED, muted),
    getSpeakerState: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SPEAKER_STATE),
    onSpeakerChanged: (callback: (state: SpeakerState | null) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: SpeakerState | null): void =>
        callback(state)
      ipcRenderer.on(IPC_CHANNELS.SPEAKER_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SPEAKER_CHANGED, handler)
    },
    addMedia: (params: CreateSourceParams) => ipcRenderer.invoke(IPC_CHANNELS.ADD_MEDIA, params),
    mediaPlay: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_PLAY, id),
    mediaPause: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_PAUSE, id),
    mediaRestart: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_RESTART, id),
    mediaStop: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_STOP, id),
    mediaSeek: (id: number, ms: number) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_SEEK, id, ms),
    mediaSetVolume: (id: number, volume: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.MEDIA_SET_VOLUME, id, volume),
    mediaSetLooping: (id: number, looping: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.MEDIA_SET_LOOPING, id, looping),
    mediaSetMonitoring: (id: number, enabled: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.MEDIA_SET_MONITORING, id, enabled),
    getMediaStatus: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.GET_MEDIA_STATUS, id),
    onMediaProgress: (callback: (status: MediaStatus | null) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: MediaStatus | null): void =>
        callback(status)
      ipcRenderer.on(IPC_CHANNELS.MEDIA_PROGRESS, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.MEDIA_PROGRESS, handler)
    },
    getSources: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SOURCES),
    removeSource: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.REMOVE_SOURCE, id),
    setSourceVisible: (id: number, visible: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_SOURCE_VISIBLE, id, visible),
    setSourceMuted: (id: number, muted: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_SOURCE_MUTED, id, muted),
    moveSource: (id: number, direction: SourceMoveDirection) =>
      ipcRenderer.invoke(IPC_CHANNELS.MOVE_SOURCE, id, direction),
    selectSource: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.SELECT_SOURCE, id),
    clearSourceSelection: () => ipcRenderer.invoke(IPC_CHANNELS.CLEAR_SOURCE_SELECTION),
    onSourcesChanged: (callback: (sources: SourceInfo[]) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, sources: SourceInfo[]): void =>
        callback(sources)
      ipcRenderer.on(IPC_CHANNELS.SOURCES_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SOURCES_CHANGED, handler)
    },
    onSelectionChanged: (callback: (selectedId: number | null) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, selectedId: number | null): void =>
        callback(selectedId)
      ipcRenderer.on(IPC_CHANNELS.SELECTION_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SELECTION_CHANGED, handler)
    },
    setRTMPConfig: (config: RTMPConfig) => ipcRenderer.invoke(IPC_CHANNELS.SET_RTMP_CONFIG, config),
    getRTMPConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_RTMP_CONFIG),
    startStreaming: () => ipcRenderer.invoke(IPC_CHANNELS.START_STREAMING),
    stopStreaming: () => ipcRenderer.invoke(IPC_CHANNELS.STOP_STREAMING),
    getStreamState: () => ipcRenderer.invoke(IPC_CHANNELS.GET_STREAM_STATE),
    onStreamStateChanged: (callback: (state: StreamState) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: StreamState): void =>
        callback(state)
      ipcRenderer.on(IPC_CHANNELS.STREAM_STATE_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.STREAM_STATE_CHANGED, handler)
    },

    setupPreview: (bounds: PreviewBounds) => ipcRenderer.invoke(IPC_CHANNELS.SETUP_PREVIEW, bounds),
    resizePreview: (bounds: PreviewBounds) =>
      ipcRenderer.invoke(IPC_CHANNELS.RESIZE_PREVIEW, bounds),
    destroyPreview: () => ipcRenderer.invoke(IPC_CHANNELS.DESTROY_PREVIEW),
    sendPreviewMouseEvent: (event: PreviewMouseEvent) =>
      ipcRenderer.send(IPC_CHANNELS.PREVIEW_MOUSE_EVENT, event),
    onPreviewCursorChanged: (callback: (cursor: PreviewCursor) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, cursor: PreviewCursor): void =>
        callback(cursor)
      ipcRenderer.on(IPC_CHANNELS.PREVIEW_CURSOR_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.PREVIEW_CURSOR_CHANGED, handler)
    }
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
  // @ts-ignore -- non-isolated context fallback
  window.electron = electronAPI
  // @ts-ignore -- non-isolated context fallback
  window.api = api
}
