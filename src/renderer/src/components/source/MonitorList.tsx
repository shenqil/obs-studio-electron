/**
 * 显示器列表组件
 */
import { useState, useEffect } from 'react'
import { Monitor, RefreshCw, Loader2 } from 'lucide-react'
import { useMonitor } from '@renderer/hooks/useMonitor'

interface MonitorListProps {
  onAdded: () => void
}

export function MonitorList({ onAdded }: MonitorListProps): React.JSX.Element {
  const { monitors, isLoading, refreshMonitors } = useMonitor()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // 初始化获取显示器列表
  useEffect(() => {
    refreshMonitors()
  }, [refreshMonitors])

  const handleSelect = async (monitorId: string): Promise<void> => {
    if (isAdding) return

    setSelectedId(monitorId)
    setIsAdding(true)

    try {
      const sourceName = await window.api.obs.addMonitor(monitorId)
      if (sourceName) {
        onAdded()
      }
    } catch (err) {
      console.error('Failed to add monitor:', err)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">选择显示器</h4>
        <button
          className="p-2 hover:bg-secondary rounded-md transition-colors"
          onClick={refreshMonitors}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {monitors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">未检测到显示器</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {monitors.map((monitor) => (
            <button
              key={monitor.id}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                ${
                  selectedId === monitor.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              onClick={() => handleSelect(monitor.id)}
              disabled={isAdding}
            >
              <Monitor className="w-4 h-4 shrink-0" />
              <span className="text-sm truncate">{monitor.name}</span>
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
