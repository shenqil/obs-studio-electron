/**
 * 通用设备列表组件
 *
 * 取代 CameraList / MonitorList / WindowList 三个重复组件。
 * 根据 DeviceKind 从设备目录读取标题/图标/枚举/添加逻辑，列举设备并支持点击添加为源。
 */
import { useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useDeviceList } from '@renderer/hooks/useDeviceList'
import { DEVICE_CATALOG, type DeviceKind } from '@renderer/lib/deviceCatalog'
import type { DeviceInfo } from '@renderer/types/obs'

interface DeviceListProps {
  kind: DeviceKind
  onAdded: () => void
}

export function DeviceList({ kind, onAdded }: DeviceListProps): React.JSX.Element {
  const entry = DEVICE_CATALOG[kind]
  const Icon = entry.icon
  const { devices, isLoading, refresh } = useDeviceList(kind)
  const [addingId, setAddingId] = useState<string | null>(null)

  const handleSelect = async (device: DeviceInfo): Promise<void> => {
    if (addingId) return
    setAddingId(device.id)
    try {
      const itemId = await entry.add({ id: device.id, name: device.name })
      if (itemId !== null) onAdded()
    } catch (err) {
      console.error(`Failed to add ${kind}:`, err)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">{entry.title}</h4>
        <button
          onClick={refresh}
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
          <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{entry.emptyText}</p>
          {entry.emptyHint && <p className="text-xs mt-1">{entry.emptyHint}</p>}
        </div>
      ) : (
        <div className="space-y-1.5">
          {devices.map((device) => (
            <button
              key={device.id}
              onClick={() => handleSelect(device)}
              disabled={addingId !== null}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group
                ${
                  addingId === device.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-70" />
              <span className="text-sm truncate flex-1">{device.name}</span>
              {addingId === device.id && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
