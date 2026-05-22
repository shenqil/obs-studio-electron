/**
 * 摄像头列表组件
 */
import { useState, useEffect } from 'react'
import { Video, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useCamera } from '@renderer/hooks/useCamera'

interface CameraListProps {
  onAdded: () => void
}

export function CameraList({ onAdded }: CameraListProps): React.JSX.Element {
  const { cameras, isLoading, refreshCameras } = useCamera()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // 初始化获取摄像头列表
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">选择摄像头</h4>
        <Button variant="ghost" size="sm" onClick={refreshCameras} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {cameras.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">未检测到摄像头设备</p>
          <p className="text-xs mt-1">请确保摄像头已连接</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {cameras.map((camera) => (
            <button
              key={camera.id}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                ${
                  selectedId === camera.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              onClick={() => handleSelect(camera.id)}
              disabled={isAdding}
            >
              <Video className="w-4 h-4 shrink-0" />
              <span className="text-sm truncate">{camera.name}</span>
            </button>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">正在添加...</span>
        </div>
      )}
    </div>
  )
}
