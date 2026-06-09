/**
 * 底部控制栏组件
 *
 * 默认显示麦克风/扬声器音频控制 + 推流控制；
 * 当选中的源为本地视频（媒体源）时，整条切换为媒体播放控制（MediaControls）。
 * 是否为媒体源以 store.media.status 是否存在为判据（主进程仅在选中媒体源时推送进度）。
 */
import { Mic } from 'lucide-react'
import { StreamButton } from '@renderer/components/streaming/StreamButton'
import { MediaControls } from '@renderer/components/streaming/MediaControls'
import { MicControls } from '@renderer/components/streaming/MicControls'
import { SpeakerControls } from '@renderer/components/streaming/SpeakerControls'
import { useAppSelector } from '@renderer/store/hooks'

export function ControlBar(): React.JSX.Element {
  const mediaStatus = useAppSelector((state) => state.media.status)
  const sources = useAppSelector((state) => state.sources.sources)
  const micSources = sources.filter((s) => s.sourceType === 'microphone')
  const speakerState = useAppSelector((state) => state.speaker.state)
  const hasAudio = micSources.length > 0 || speakerState !== null

  return (
    <div className="h-full flex items-center bg-card border-t border-border">
      {mediaStatus ? (
        <MediaControls />
      ) : (
        <>
          {/* 左侧：音频控制（麦克风 + 扬声器） */}
          <div className="flex-1 flex items-center gap-4 px-4">
            {hasAudio ? (
              <>
                {micSources.length > 0 && <MicControls micSources={micSources} />}
                <SpeakerControls />
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mic className="w-4 h-4" />
                <span className="text-sm">无音频源</span>
              </div>
            )}
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
