/**
 * 切换设备侧滑面板
 *
 * 根据源类型展示对应的设备列表（摄像头/显示器/窗口/麦克风）或文件选择（本地视频），
 * 选中后调用 window.api.obs.switchSourceDevice(id, params) 切换，并关闭面板。
 * 列表/选中态由主进程 sources:changed 回灌，本组件不维护派生状态。
 */
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Loader2, Video, Monitor, Square, Mic, FileVideo } from 'lucide-react'
import { SlidePanel } from '@renderer/components/ui/SlidePanel'
import type { DeviceInfo, SourceInfo, SourceType } from '@renderer/types/obs'

interface SwitchDeviceDialogProps {
  source: SourceInfo
  onClose: () => void
}

/** 基于设备列表切换的源类型配置（媒体源走文件选择，单独处理）。 */
const DEVICE_CONFIG: Partial<
  Record<
    SourceType,
    {
      title: string
      emptyText: string
      icon: React.ComponentType<{ className?: string }>
      list: () => Promise<DeviceInfo[]>
    }
  >
> = {
  camera: {
    title: '切换摄像头',
    emptyText: '未检测到摄像头',
    icon: Video,
    list: () => window.api.obs.getCameras()
  },
  monitor: {
    title: '切换显示器',
    emptyText: '未检测到显示器',
    icon: Monitor,
    list: () => window.api.obs.getMonitors()
  },
  window: {
    title: '切换窗口',
    emptyText: '未检测到可捕获的窗口',
    icon: Square,
    list: () => window.api.obs.getWindows()
  },
  microphone: {
    title: '切换麦克风',
    emptyText: '未检测到麦克风',
    icon: Mic,
    list: () => window.api.obs.getMicrophones()
  }
}

/** 支持的视频文件扩展名过滤（与 MediaFilePicker 保持一致） */
const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'ts', 'm4v']

export function SwitchDeviceDialog({
  source,
  onClose
}: SwitchDeviceDialogProps): React.JSX.Element {
  const isMedia = source.sourceType === 'media'
  const config = DEVICE_CONFIG[source.sourceType]

  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [isLoading, setIsLoading] = useState(!isMedia)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchDevices = useCallback(async () => {
    if (!config) return
    setIsLoading(true)
    try {
      setDevices(await config.list())
    } catch (err) {
      console.error('Failed to list devices:', err)
    } finally {
      setIsLoading(false)
    }
  }, [config])

  useEffect(() => {
    if (!isMedia) fetchDevices()
  }, [isMedia, fetchDevices])

  const handleSelect = async (device: DeviceInfo): Promise<void> => {
    if (busyId) return
    setBusyId(device.id)
    try {
      const ok = await window.api.obs.switchSourceDevice(source.id, {
        id: device.id,
        name: device.name
      })
      if (ok) onClose()
    } catch (err) {
      console.error('Failed to switch device:', err)
    } finally {
      setBusyId(null)
    }
  }

  const handlePickFile = async (): Promise<void> => {
    if (busyId) return
    try {
      const result = await window.electron.ipcRenderer.invoke('dialog:openFile', {
        title: '选择视频文件',
        filters: [{ name: '视频文件', extensions: VIDEO_EXTENSIONS }],
        properties: ['openFile']
      })
      if (!result || result.canceled || !result.filePaths?.length) return

      const filePath = result.filePaths[0]
      const fileName = filePath.split(/[/\\]/).pop() ?? '本地视频'
      setBusyId(filePath)
      const ok = await window.api.obs.switchSourceDevice(source.id, {
        id: filePath,
        name: fileName
      })
      if (ok) onClose()
    } catch (err) {
      console.error('Failed to switch media file:', err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SlidePanel isOpen={true} onClose={onClose} title="切换设备">
      {isMedia ? (
        <div className="p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">切换本地视频</h4>
          <p className="text-xs text-zinc-500 mb-4">支持格式：{VIDEO_EXTENSIONS.join('、')}</p>
          <button
            onClick={handlePickFile}
            disabled={busyId !== null}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 text-zinc-300 hover:text-zinc-100 transition-all"
          >
            {busyId ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileVideo className="w-5 h-5" />
            )}
            <span className="text-sm">选择视频文件</span>
          </button>
        </div>
      ) : !config ? (
        <div className="p-4 text-sm text-zinc-500">该源不支持切换设备</div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-zinc-300">{config.title}</h4>
            <button
              onClick={fetchDevices}
              disabled={isLoading}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              <config.icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{config.emptyText}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleSelect(device)}
                  disabled={busyId !== null}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                    ${
                      busyId === device.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                    }`}
                >
                  <config.icon className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="text-sm truncate flex-1">{device.name}</span>
                  {busyId === device.id && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </SlidePanel>
  )
}
