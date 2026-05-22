/**
 * 底部控制栏组件
 * 负责音频源展示
 */
import { Mic } from 'lucide-react'
import { StreamButton } from '@renderer/components/streaming/StreamButton'

export function ControlBar(): React.JSX.Element {
  return (
    <div className="h-full flex bg-card border-t">
      {/* 左侧：音频列表区域 */}
      <div className="flex-1 border-r p-4 overflow-y-auto">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mic className="w-4 h-4" />
          <span className="text-sm">音频源</span>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          <p>暂无音频源</p>
          <p className="text-xs mt-1">添加麦克风后在列表中显示</p>
        </div>
      </div>

      {/* 右侧：推流控制 */}
      <div className="flex items-center justify-center px-6">
        <StreamButton />
      </div>
    </div>
  )
}
