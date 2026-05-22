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
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">选择显示器</h4>
        <button
          onClick={refreshMonitors}
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

      {monitors.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">
          <Monitor className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">未检测到显示器</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {monitors.map((monitor) => (
            <button
              key={monitor.id}
              onClick={() => handleSelect(monitor.id)}
              disabled={isAdding}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group
                ${
                  selectedId === monitor.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <Monitor className="w-4 h-4 shrink-0 opacity-70" />
              <span className="text-sm truncate flex-1">{monitor.name}</span>
              {isAdding && selectedId === monitor.id && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
