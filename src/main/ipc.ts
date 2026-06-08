/**
 * IPC 处理器模块
 *
 * 仅做 IPC 通道与 OBS api 层之间的转发，业务逻辑全部在 obs/api 中。
 */
import { ipcMain, dialog } from 'electron'
import {
  isReady,
  listCameras,
  listScreens,
  listWindows,
  listMicrophones,
  addCamera,
  addScreen,
  addWindow,
  addMedia,
  addMicrophone,
  setMicVolume,
  getMicVolume,
  switchMicDevice,
  mediaPlay,
  mediaPause,
  mediaRestart,
  mediaStop,
  mediaSeek,
  mediaSetVolume,
  mediaSetLooping,
  getMediaStatus,
  listSources,
  removeSource,
  setSourceVisible,
  setSourceMuted,
  moveSource,
  selectSource,
  clearSourceSelection,
  setRTMPConfig,
  getRTMPConfig,
  startStreaming,
  stopStreaming,
  getStreamState,
  setupPreview,
  resizePreview,
  destroyPreview,
  handlePreviewMouseEvent,
  SourceMoveDirection
} from './obs'
import { IPC_CHANNELS } from '../shared/types'
import type { CreateSourceParams, PreviewMouseEvent } from '../shared/types'

type PreviewBounds = { x: number; y: number; width: number; height: number }

/**
 * 设置 IPC 处理器
 */
export function setupIPCHandlers(): void {
  // OBS 状态
  ipcMain.handle(IPC_CHANNELS.IS_OBS_READY, () => isReady())

  // 摄像头
  ipcMain.handle(IPC_CHANNELS.GET_CAMERAS, () => listCameras())
  ipcMain.handle(IPC_CHANNELS.ADD_CAMERA, (_event, params: CreateSourceParams) => addCamera(params))

  // 显示器
  ipcMain.handle(IPC_CHANNELS.GET_MONITORS, () => listScreens())
  ipcMain.handle(IPC_CHANNELS.ADD_MONITOR, (_event, params: CreateSourceParams) =>
    addScreen(params)
  )

  // 窗口
  ipcMain.handle(IPC_CHANNELS.GET_WINDOWS, () => listWindows())
  ipcMain.handle(IPC_CHANNELS.ADD_WINDOW, (_event, params: CreateSourceParams) => addWindow(params))

  // 麦克风（音频输入）
  ipcMain.handle(IPC_CHANNELS.GET_MICROPHONES, () => listMicrophones())
  ipcMain.handle(IPC_CHANNELS.ADD_MICROPHONE, (_event, params: CreateSourceParams) =>
    addMicrophone(params)
  )
  ipcMain.handle(IPC_CHANNELS.SET_MIC_VOLUME, (_event, id: number, volume: number) =>
    setMicVolume(id, volume)
  )
  ipcMain.handle(IPC_CHANNELS.GET_MIC_VOLUME, (_event, id: number) => getMicVolume(id))
  ipcMain.handle(IPC_CHANNELS.SWITCH_MIC_DEVICE, (_event, id: number, deviceId: string) =>
    switchMicDevice(id, deviceId)
  )

  // 本地视频（媒体源）
  ipcMain.handle(IPC_CHANNELS.ADD_MEDIA, (_event, params: CreateSourceParams) => addMedia(params))
  ipcMain.handle(IPC_CHANNELS.MEDIA_PLAY, (_event, id: number) => mediaPlay(id))
  ipcMain.handle(IPC_CHANNELS.MEDIA_PAUSE, (_event, id: number) => mediaPause(id))
  ipcMain.handle(IPC_CHANNELS.MEDIA_RESTART, (_event, id: number) => mediaRestart(id))
  ipcMain.handle(IPC_CHANNELS.MEDIA_STOP, (_event, id: number) => mediaStop(id))
  ipcMain.handle(IPC_CHANNELS.MEDIA_SEEK, (_event, id: number, ms: number) => mediaSeek(id, ms))
  ipcMain.handle(IPC_CHANNELS.MEDIA_SET_VOLUME, (_event, id: number, volume: number) =>
    mediaSetVolume(id, volume)
  )
  ipcMain.handle(IPC_CHANNELS.MEDIA_SET_LOOPING, (_event, id: number, looping: boolean) =>
    mediaSetLooping(id, looping)
  )
  ipcMain.handle(IPC_CHANNELS.GET_MEDIA_STATUS, (_event, id: number) => getMediaStatus(id))

  // 源管理（统一以场景项 id 为键）
  ipcMain.handle(IPC_CHANNELS.GET_SOURCES, () => listSources())
  ipcMain.handle(IPC_CHANNELS.REMOVE_SOURCE, (_event, id: number) => removeSource(id))
  ipcMain.handle(IPC_CHANNELS.SET_SOURCE_VISIBLE, (_event, id: number, visible: boolean) =>
    setSourceVisible(id, visible)
  )
  ipcMain.handle(IPC_CHANNELS.SET_SOURCE_MUTED, (_event, id: number, muted: boolean) =>
    setSourceMuted(id, muted)
  )
  ipcMain.handle(IPC_CHANNELS.MOVE_SOURCE, (_event, id: number, direction: SourceMoveDirection) =>
    moveSource(id, direction)
  )
  ipcMain.handle(IPC_CHANNELS.SELECT_SOURCE, (_event, id: number) => selectSource(id))
  ipcMain.handle(IPC_CHANNELS.CLEAR_SOURCE_SELECTION, () => clearSourceSelection())

  // 推流
  ipcMain.handle(IPC_CHANNELS.SET_RTMP_CONFIG, (_event, config: { server: string; key: string }) =>
    setRTMPConfig(config)
  )
  ipcMain.handle(IPC_CHANNELS.GET_RTMP_CONFIG, () => getRTMPConfig())
  ipcMain.handle(IPC_CHANNELS.START_STREAMING, () => startStreaming())
  ipcMain.handle(IPC_CHANNELS.STOP_STREAMING, () => stopStreaming())
  ipcMain.handle(IPC_CHANNELS.GET_STREAM_STATE, () => getStreamState())

  // 预览
  ipcMain.handle(IPC_CHANNELS.SETUP_PREVIEW, (_event, bounds: PreviewBounds) =>
    setupPreview(bounds)
  )
  ipcMain.handle(IPC_CHANNELS.RESIZE_PREVIEW, (_event, bounds: PreviewBounds) =>
    resizePreview(bounds)
  )
  ipcMain.handle(IPC_CHANNELS.DESTROY_PREVIEW, () => destroyPreview())

  // 预览鼠标事件：高频单向，用 on 而非 handle
  ipcMain.on(IPC_CHANNELS.PREVIEW_MOUSE_EVENT, (_event, mouseEvent: PreviewMouseEvent) =>
    handlePreviewMouseEvent(mouseEvent)
  )

  // 文件选择对话框（用于本地视频等）
  ipcMain.handle(
    'dialog:openFile',
    async (
      _event,
      options: { title?: string; filters?: Electron.FileFilter[]; properties?: string[] }
    ) => {
      const result = await dialog.showOpenDialog({
        title: options.title,
        filters: options.filters,
        properties: (options.properties as Electron.OpenDialogOptions['properties']) ?? ['openFile']
      })
      return result
    }
  )
}

/**
 * 清理 IPC 处理器
 */
export function cleanupIPCHandlers(): void {
  const channels = Object.values(IPC_CHANNELS) as string[]
  channels.forEach((channel) => {
    ipcMain.removeHandler(channel)
    // on 注册的监听器（如预览鼠标事件）用 removeAllListeners 清理
    ipcMain.removeAllListeners(channel)
  })
}
