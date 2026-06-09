/**
 * 扬声器设备列表组件
 *
 * 扬声器是单例（独立全局输出通道）。点击设备即「设置/切换」当前扬声器：
 * 未创建则创建，已创建且设备不同则切换，相同则无操作。当前设备高亮标记。
 */
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Loader2, Volume2, Check } from 'lucide-react'
import { useAppSelector } from '@renderer/store/hooks'
import type { DeviceInfo } from '@renderer/types/obs'

interface SpeakerListProps {
  onAdded: () => void
}

export function SpeakerList({ onAdded }: SpeakerListProps): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [settingId, setSettingId] = useState<string | null>(null)

  // 当前扬声器单例状态（独立通道，不在 sources 列表里）
  const speakerState = useAppSelector((state) => state.speaker.state)
  const currentDeviceId = speakerState?.deviceId ?? null

  const fetchDevices = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await window.api.obs.getSpeakers()
      setDevices(list)
    } catch (err) {
      console.error('Failed to list speakers:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const handleSelect = async (device: DeviceInfo): Promise<void> => {
    if (settingId || device.id === currentDeviceId) return
    setSettingId(device.id)
    try {
      const state = await window.api.obs.setSpeaker({ id: device.id, name: device.name })
      if (state) onAdded()
    } catch (err) {
      console.error('Failed to set speaker:', err)
    } finally {
      setSettingId(null)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">选择扬声器</h4>
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
          <Volume2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">未检测到扬声器设备</p>
          <p className="text-xs mt-1">请确保音频输出设备已连接</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {devices.map((device) => {
            const current = device.id === currentDeviceId
            return (
              <button
                key={device.id}
                onClick={() => handleSelect(device)}
                disabled={settingId !== null || current}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group
                  ${
                    current
                      ? 'bg-zinc-800/30 text-zinc-500 cursor-not-allowed'
                      : settingId === device.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                  }`}
              >
                <Volume2 className="w-4 h-4 shrink-0 opacity-70" />
                <span className="text-sm truncate flex-1">{device.name}</span>
                {current && <Check className="w-4 h-4 text-green-500" />}
                {settingId === device.id && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
