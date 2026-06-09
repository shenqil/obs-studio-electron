/**
 * 源项组件
 *
 * 两行布局：
 *   - 第一行：图标 + 名称（超出省略，悬浮 title 展示全名）。
 *   - 第二行：操作按钮——切换设备 / 显示·隐藏 / 上移 / 下移 / 删除。
 *
 * 所有操作 fire-and-forget 调用 window.api.obs，列表/选中态由 sources:changed 回灌，
 * 组件本身不维护任何派生状态（selected 直接取自 source.selected）。
 */
import {
  Video,
  Monitor,
  Square,
  FileVideo,
  Mic,
  Repeat,
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
  /** 请求切换该源的设备（由 SourceList 弹出切换设备侧滑面板） */
  onSwitchDevice: (source: SourceInfo) => void
}

const ICONS = {
  camera: Video,
  monitor: Monitor,
  window: Square,
  media: FileVideo,
  microphone: Mic
} as const

export function SourceItem({ source, onSwitchDevice }: SourceItemProps): React.JSX.Element {
  const Icon = ICONS[source.sourceType as keyof typeof ICONS] ?? Video
  const displayName = source.sourceLabel || source.sourceName
  const { id, visible, selected } = source

  return (
    <div
      className={`flex flex-col gap-2 px-3 py-2.5 rounded-lg transition-colors cursor-pointer
        ${visible ? 'bg-zinc-800/60' : 'bg-zinc-900/40 opacity-60'}
        ${selected ? 'ring-1 ring-emerald-500 bg-zinc-800' : 'hover:bg-zinc-800'}`}
      onClick={() => window.api.obs.selectSource(id)}
    >
      {/* 第一行：名称 */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1.5 bg-zinc-700/50 rounded text-zinc-400 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <p className="flex-1 text-sm text-zinc-200 truncate" title={displayName}>
          {displayName}
        </p>
      </div>

      {/* 第二行：操作 */}
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onSwitchDevice(source)}
          title="切换设备"
        >
          <Repeat className="w-3.5 h-3.5" />
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
