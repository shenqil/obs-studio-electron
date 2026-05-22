/**
 * 窗口列表组件
 */
import { useState, useEffect } from 'react'
import { Square, RefreshCw, Loader2 } from 'lucide-react'
import { useWindow } from '@renderer/hooks/useWindow'

interface WindowListProps {
  onAdded: () => void
}

export function WindowList({ onAdded }: WindowListProps): React.JSX.Element {
  const { windows, isLoading, refreshWindows } = useWindow()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    refreshWindows()
  }, [refreshWindows])

  const handleSelect = async (windowId: string): Promise<void> => {
    if (isAdding) return

    setSelectedId(windowId)
    setIsAdding(true)

    try {
      const sourceName = await window.api.obs.addWindow(windowId)
      if (sourceName) {
        onAdded()
      }
    } catch (err) {
      console.error('Failed to add window:', err)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">选择窗口</h4>
        <button
          onClick={refreshWindows}
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

      {windows.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">
          <Square className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">未检测到可捕获的窗口</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {windows.map((win) => (
            <button
              key={win.id}
              onClick={() => handleSelect(win.id)}
              disabled={isAdding}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group
                ${
                  selectedId === win.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <Square className="w-4 h-4 shrink-0 opacity-70" />
              <span className="text-sm truncate flex-1">{win.name}</span>
              {isAdding && selectedId === win.id && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
