/**
 * 源项组件
 */
import { useState } from 'react'
import { Video, Monitor, Square, ChevronUp, ChevronDown, Eye, EyeOff, X } from 'lucide-react'
import { useAppDispatch } from '@renderer/store/hooks'
import {
  removeSource,
  setSourceVisible,
  moveSourceUp,
  moveSourceDown
} from '@renderer/store/slices/sourcesSlice'
import type { SourceInfo } from '@renderer/types/obs'

interface SourceItemProps {
  source: SourceInfo
}

export function SourceItem({ source }: SourceItemProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const [showActions, setShowActions] = useState(false)

  const getIcon = (): React.JSX.Element => {
    switch (source.type) {
      case 'camera':
        return <Video className="w-4 h-4" />
      case 'monitor':
        return <Monitor className="w-4 h-4" />
      case 'window':
        return <Square className="w-4 h-4" />
      default:
        return <Video className="w-4 h-4" />
    }
  }

  const handleRemove = (): void => {
    dispatch(removeSource(source.sourceName))
  }

  const handleToggleVisible = (): void => {
    dispatch(setSourceVisible({ sourceName: source.sourceName, visible: !source.visible }))
  }

  const handleMoveUp = (): void => {
    dispatch(moveSourceUp(source.sourceName))
  }

  const handleMoveDown = (): void => {
    dispatch(moveSourceDown(source.sourceName))
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors group
        ${source.visible ? 'bg-zinc-800/60' : 'bg-zinc-900/40 opacity-60'}
        hover:bg-zinc-800`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 图标 */}
      <div className="p-1.5 bg-zinc-700/50 rounded text-zinc-400 shrink-0">{getIcon()}</div>

      {/* 名称 */}
      <p className="flex-1 text-sm text-zinc-300 truncate cursor-default" title={source.name}>
        {source.name}
      </p>

      {/* 操作按钮 */}
      <div
        className={`flex items-center gap-0.5 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={handleMoveUp}
          title="上移"
          className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMoveDown}
          title="下移"
          className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleToggleVisible}
          title={source.visible ? '隐藏' : '显示'}
          className={`p-1 rounded transition-colors ${
            source.visible
              ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700'
              : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          {source.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleRemove}
          title="删除"
          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
