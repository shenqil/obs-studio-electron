/**
 * 摄像头列表组件
 */
import { useState, useEffect } from 'react'
import { Video, RefreshCw, Loader2 } from 'lucide-react'
import { useCamera } from '@renderer/hooks/useCamera'

interface CameraListProps {
  onAdded: () => void
}

export function CameraList({ onAdded }: CameraListProps): React.JSX.Element {
  const { cameras, isLoading, refreshCameras } = useCamera()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    refreshCameras()
  }, [refreshCameras])

  const handleSelect = async (deviceId: string): Promise<void> => {
    if (isAdding) return

    setSelectedId(deviceId)
    setIsAdding(true)

    try {
      const sourceName = await window.api.obs.addCamera(deviceId)
      if (sourceName) {
        onAdded()
      }
    } catch (err) {
      console.error('Failed to add camera:', err)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">选择摄像头</h4>
        <button
          onClick={refreshCameras}
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

      {cameras.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">未检测到摄像头设备</p>
          <p className="text-xs mt-1">请确保摄像头已连接</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {cameras.map((camera) => (
            <button
              key={camera.id}
              onClick={() => handleSelect(camera.id)}
              disabled={isAdding}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group
                ${selectedId === camera.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <Video className="w-4 h-4 shrink-0 opacity-70" />
              <span className="text-sm truncate flex-1">{camera.name}</span>
              {isAdding && selectedId === camera.id && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
