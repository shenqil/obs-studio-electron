/**
 * IPC 处理器模块
 */
import { ipcMain, BrowserWindow } from 'electron'
import {
  getCameraDevices,
  addCameraSource,
  getMonitorDevices,
  addMonitorSource,
  getWindowDevices,
  addWindowSource,
  getSources,
  removeSource,
  setSourceVisible,
  moveSourceUp,
  moveSourceDown,
  setRTMPConfig,
  getRTMPConfig,
  startStreaming,
  stopStreaming,
  getStreamState,
  setSignalCallback,
  setupPreview,
  resizePreview,
  destroyPreview,
  setShouldDrawUI,
  setDrawGuideLines,
  IPC_CHANNELS
} from './obs'

// 存储主窗口引用
let mainWindow: BrowserWindow | null = null

/**
 * 设置 IPC 处理器
 */
export function setupIPCHandlers(): void {
  // 摄像头相关
  ipcMain.handle(IPC_CHANNELS.GET_CAMERAS, () => {
    return getCameraDevices()
  })

  ipcMain.handle(IPC_CHANNELS.ADD_CAMERA, (_event, deviceId: string) => {
    return addCameraSource(deviceId)
  })

  // 显示器相关
  ipcMain.handle(IPC_CHANNELS.GET_MONITORS, () => {
    return getMonitorDevices()
  })

  ipcMain.handle(IPC_CHANNELS.ADD_MONITOR, (_event, monitorId: string) => {
    return addMonitorSource(monitorId)
  })

  // 窗口相关
  ipcMain.handle(IPC_CHANNELS.GET_WINDOWS, () => {
    return getWindowDevices()
  })

  ipcMain.handle(IPC_CHANNELS.ADD_WINDOW, (_event, windowId: string, sourceName?: string) => {
    return addWindowSource(windowId, sourceName)
  })

  // 源管理
  ipcMain.handle(IPC_CHANNELS.GET_SOURCES, () => {
    return getSources()
  })

  ipcMain.handle(IPC_CHANNELS.REMOVE_SOURCE, (_event, sourceName: string) => {
    return removeSource(sourceName)
  })

  ipcMain.handle(
    IPC_CHANNELS.SET_SOURCE_VISIBLE,
    (_event, sourceName: string, visible: boolean) => {
      return setSourceVisible(sourceName, visible)
    }
  )

  ipcMain.handle(IPC_CHANNELS.MOVE_SOURCE_UP, (_event, sourceName: string) => {
    return moveSourceUp(sourceName)
  })

  ipcMain.handle(IPC_CHANNELS.MOVE_SOURCE_DOWN, (_event, sourceName: string) => {
    return moveSourceDown(sourceName)
  })

  // 推流相关
  ipcMain.handle(
    IPC_CHANNELS.SET_RTMP_CONFIG,
    (_event, config: { server: string; key: string }) => {
      return setRTMPConfig(config)
    }
  )

  ipcMain.handle(IPC_CHANNELS.GET_RTMP_CONFIG, () => {
    return getRTMPConfig()
  })

  ipcMain.handle(IPC_CHANNELS.START_STREAMING, () => {
    return startStreaming()
  })

  ipcMain.handle(IPC_CHANNELS.STOP_STREAMING, () => {
    return stopStreaming()
  })

  ipcMain.handle(IPC_CHANNELS.GET_STREAM_STATE, () => {
    return getStreamState()
  })

  // 预览相关
  ipcMain.handle(
    IPC_CHANNELS.SET_PREVIEW,
    (_event, bounds: { x: number; y: number; width: number; height: number }) => {
      if (!mainWindow) {
        console.error('Main window not set for preview')
        return null
      }
      return setupPreview(mainWindow, bounds)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.RESIZE_PREVIEW,
    (_event, bounds: { x: number; y: number; width: number; height: number }) => {
      if (!mainWindow) {
        console.error('Main window not set for preview')
        return null
      }
      return resizePreview(mainWindow, bounds)
    }
  )

  ipcMain.handle(IPC_CHANNELS.DESTROY_PREVIEW, () => {
    destroyPreview()
    return true
  })

  ipcMain.handle(IPC_CHANNELS.SET_SHOULD_DRAW_UI, (_event, drawUI: boolean) => {
    setShouldDrawUI(drawUI)
  })

  ipcMain.handle(IPC_CHANNELS.SET_DRAW_GUIDE_LINES, (_event, drawGuideLines: boolean) => {
    setDrawGuideLines(drawGuideLines)
  })
}

/**
 * 设置主窗口引用（用于预览功能）
 */
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window
}

/**
 * 获取主窗口引用
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * 清理 IPC 处理器
 */
export function cleanupIPCHandlers(): void {
  const channels = Object.values(IPC_CHANNELS) as string[]
  channels.forEach((channel) => {
    ipcMain.removeHandler(channel)
  })
  mainWindow = null
}

/**
 * 设置信号回调，向渲染进程发送状态变化
 */
export function setupSignalCallback(): void {
  setSignalCallback((signal) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(IPC_CHANNELS.STREAM_STATE_CHANGED, signal)
    })
  })
}
