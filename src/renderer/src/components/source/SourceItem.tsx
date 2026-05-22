/**
 * 源项组件
 */
import { useState } from 'react'
import { Video, Monitor, ChevronUp, ChevronDown, Eye, EyeOff, X } from 'lucide-react'
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
        return <Video className="w-5 h-5" />
      case 'monitor':
        return <Monitor className="w-5 h-5" />
      default:
        return <Video className="w-5 h-5" />
    }
  }

  const getTypeLabel = (): string => {
    switch (source.type) {
      case 'camera':
        return '摄像头'
      case 'monitor':
        return '屏幕捕获'
      default:
        return source.type
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
      className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 左侧图标 */}
      <div className="p-2 bg-primary/10 rounded-md shrink-0">{getIcon()}</div>

      {/* 右侧内容 */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* 名称 */}
        <p className="font-medium text-sm truncate cursor-default" title={source.name}>
          {source.name}
        </p>

        {/* 底部：类型标签 + 操作图标 */}
        <div className="flex items-center justify-between">
          {/* 操作图标 */}
          <div
            className={`flex items-center gap-1 transition-opacity ${
              showActions ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              className="p-1 hover:bg-primary/20 rounded transition-colors"
              onClick={handleMoveUp}
              title="上移"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-primary/20 rounded transition-colors"
              onClick={handleMoveDown}
              title="下移"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-primary/20 rounded transition-colors"
              onClick={handleToggleVisible}
              title={source.visible ? '隐藏' : '显示'}
            >
              {source.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <button
              className="p-1 hover:bg-destructive/20 rounded transition-colors text-destructive"
              onClick={handleRemove}
              title="删除"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
