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

  // 初始化获取窗口列表
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">选择窗口</h4>
        <button
          className="p-2 hover:bg-secondary rounded-md transition-colors"
          onClick={refreshWindows}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {windows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Square className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">未检测到可捕获的窗口</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {windows.map((win) => (
            <button
              key={win.id}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                ${
                  selectedId === win.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              onClick={() => handleSelect(win.id)}
              disabled={isAdding}
            >
              <Square className="w-4 h-4 shrink-0" />
              <span className="text-sm truncate">{win.name}</span>
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
