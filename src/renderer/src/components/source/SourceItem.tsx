/**
 * 源项组件
 *
 * 所有操作 fire-and-forget 调用 window.api.obs，列表/选中态由 sources:changed 回灌，
 * 组件本身不维护任何派生状态（selected 直接取自 source.selected）。
 */
import { useState } from 'react'
import {
  Video,
  Monitor,
  Square,
  FileVideo,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { SourceMoveDirection } from '@renderer/types/obs'
import type { SourceInfo } from '@renderer/types/obs'

interface SourceItemProps {
  source: SourceInfo
}

const ICONS = {
  monitor: Monitor,
  window: Square,
  media: FileVideo
} as const

export function SourceItem({ source }: SourceItemProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false)

  const Icon = ICONS[source.sourceType as keyof typeof ICONS] ?? Video
  const displayName = source.sourceLabel || source.sourceName
  const { id, visible, selected } = source

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group cursor-pointer
        ${visible ? 'bg-zinc-800/60' : 'bg-zinc-900/40 opacity-60'}
        ${selected ? 'ring-1 ring-emerald-500 bg-zinc-800' : 'hover:bg-zinc-800'}`}
      onClick={() => window.api.obs.selectSource(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="p-1.5 bg-zinc-700/50 rounded text-zinc-400 shrink-0">
        <Icon className="w-4 h-4" />
      </div>

      <p className="flex-1 text-sm text-zinc-300 truncate" title={displayName}>
        {displayName}
      </p>

      <div
        className={`flex items-center gap-0.5 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => window.api.obs.moveSource(id, SourceMoveDirection.Up)}
          title="上移"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => window.api.obs.moveSource(id, SourceMoveDirection.Down)}
          title="下移"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => window.api.obs.setSourceVisible(id, !visible)}
          title={visible ? '隐藏' : '显示'}
        >
          {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:text-red-400"
          onClick={() => window.api.obs.removeSource(id)}
          title="删除"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
