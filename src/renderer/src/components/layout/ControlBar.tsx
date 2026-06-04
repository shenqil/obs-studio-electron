/**
 * 底部控制栏组件
 *
 * 默认显示音频源占位 + 推流控制；
 * 当选中的源为本地视频（媒体源）时，整条切换为媒体播放控制（MediaControls）。
 * 是否为媒体源以 store.media.status 是否存在为判据（主进程仅在选中媒体源时推送进度）。
 */
import { Mic } from 'lucide-react'
import { StreamButton } from '@renderer/components/streaming/StreamButton'
import { MediaControls } from '@renderer/components/streaming/MediaControls'
import { useAppSelector } from '@renderer/store/hooks'

export function ControlBar(): React.JSX.Element {
  const mediaStatus = useAppSelector((state) => state.media.status)

  return (
    <div className="h-full flex items-center bg-card border-t border-border">
      {mediaStatus ? (
        <MediaControls />
      ) : (
        <>
          {/* 左侧：音频源占位 */}
          <div className="flex-1 flex items-center gap-2 px-4 text-muted-foreground">
            <Mic className="w-4 h-4" />
            <span className="text-sm">音频源（暂无）</span>
          </div>

          {/* 右侧：推流控制 */}
          <div className="flex items-center px-6">
            <StreamButton />
          </div>
        </>
      )}
    </div>
  )
}
