/**
 * 麦克风设备列表组件
 *
 * 列举可用麦克风设备，支持点击添加为源。
 * 每个设备只能添加一次（已添加的显示为已添加状态）。
 */
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Loader2, Mic, Check } from 'lucide-react'
import { useAppSelector } from '@renderer/store/hooks'
import type { DeviceInfo } from '@renderer/types/obs'

interface MicrophoneListProps {
  onAdded: () => void
}

export function MicrophoneList({ onAdded }: MicrophoneListProps): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addingId, setAddingId] = useState<string | null>(null)

  // 获取已添加的麦克风源的设备 id 列表（用于去重）
  const sources = useAppSelector((state) => state.sources.sources)
  const addedMicIds = sources.filter((s) => s.sourceType === 'microphone').map((s) => s.sourceName)

  const fetchDevices = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await window.api.obs.getMicrophones()
      setDevices(list)
    } catch (err) {
      console.error('Failed to list microphones:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const handleSelect = async (device: DeviceInfo): Promise<void> => {
    if (addingId) return
    setAddingId(device.id)
    try {
      const itemId = await window.api.obs.addMicrophone({ id: device.id, name: device.name })
      if (itemId !== null) onAdded()
    } catch (err) {
      console.error('Failed to add microphone:', err)
    } finally {
      setAddingId(null)
    }
  }

  // 判断设备是否已添加（通过 sourceName 包含设备名来匹配）
  // 更精确的方式：sourceName 中存放了用户给的 name，即 device.name
  const isDeviceAdded = (device: DeviceInfo): boolean => {
    return addedMicIds.includes(device.name)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">选择麦克风</h4>
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
          <Mic className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">未检测到麦克风设备</p>
          <p className="text-xs mt-1">请确保麦克风已连接</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {devices.map((device) => {
            const added = isDeviceAdded(device)
            return (
              <button
                key={device.id}
                onClick={() => !added && handleSelect(device)}
                disabled={addingId !== null || added}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group
                  ${
                    added
                      ? 'bg-zinc-800/30 text-zinc-500 cursor-not-allowed'
                      : addingId === device.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                  }`}
              >
                <Mic className="w-4 h-4 shrink-0 opacity-70" />
                <span className="text-sm truncate flex-1">{device.name}</span>
                {added && <Check className="w-4 h-4 text-green-500" />}
                {addingId === device.id && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
