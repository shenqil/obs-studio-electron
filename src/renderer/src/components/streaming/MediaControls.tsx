/**
 * 媒体（本地视频）控制条
 *
 * 当选中的源为本地视频时，ControlBar 整条切换为本组件。
 * 进度/音量以主进程推送的 media:progress（store.media.status）为真相；
 * 播放态不再由主进程上报，而是由 App 的进度订阅依据「进度是否推进」判断后写入 store.media.isPlaying：
 *   主进程每 500ms 推一次进度，若 currentTime 持续 1s 未变化则视为非播放，否则视为播放。
 * 拖拽进度条时本地临时接管显示值，松手后写回主进程并恢复跟随推送。
 */
import { useState } from 'react'
import { Play, Pause, RotateCcw, Square, Volume2, VolumeX, FileVideo, Repeat } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useAppSelector } from '@renderer/store/hooks'

/** 毫秒格式化为 mm:ss */
function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '00:00'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function MediaControls(): React.JSX.Element | null {
  const status = useAppSelector((state) => state.media.status)
  const isPlaying = useAppSelector((state) => state.media.isPlaying)
  // 进度条拖拽时的临时值（非 null 表示正在拖拽，显示用本地值）
  const [seekDraft, setSeekDraft] = useState<number | null>(null)
  // 音量本地值：滑动即时反馈，同时下发主进程
  const [volumeDraft, setVolumeDraft] = useState<number | null>(null)
  // 循环本地值：点击即时反馈，同时下发主进程；下一次进度推送回灌后归位
  const [loopingDraft, setLoopingDraft] = useState<boolean | null>(null)
  // 记录上一次的媒体项 id，切换源时在渲染期间重置本地拖拽值（React 推荐的「渲染中调整 state」模式，避免 effect 级联渲染）
  const [trackedItemId, setTrackedItemId] = useState<number | null>(status?.itemId ?? null)

  if ((status?.itemId ?? null) !== trackedItemId) {
    setTrackedItemId(status?.itemId ?? null)
    setSeekDraft(null)
    setVolumeDraft(null)
    setLoopingDraft(null)
  }

  // 主进程回灌的 looping 已与本地草稿一致时，清掉草稿，回到「跟随推送」
  if (loopingDraft !== null && status?.looping === loopingDraft) {
    setLoopingDraft(null)
  }

  if (!status) return null

  const { itemId, duration, currentTime, volume, looping } = status
  const displayTime = seekDraft ?? currentTime
  const displayVolume = volumeDraft ?? volume
  const displayLooping = loopingDraft ?? looping
  const hasDuration = duration > 0

  const handleTogglePlay = (): void => {
    if (isPlaying) {
      window.api.obs.mediaPause(itemId)
    } else {
      window.api.obs.mediaPlay(itemId)
    }
  }

  const handleRestart = (): void => {
    window.api.obs.mediaRestart(itemId)
  }

  const handleStop = (): void => {
    window.api.obs.mediaStop(itemId)
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSeekDraft(Number(e.target.value))
  }

  const handleSeekCommit = (
    e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>
  ): void => {
    const ms = Number(e.currentTarget.value)
    window.api.obs.mediaSeek(itemId, ms)
    setSeekDraft(null)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = Number(e.target.value)
    setVolumeDraft(v)
    window.api.obs.mediaSetVolume(itemId, v)
  }

  const handleToggleMute = (): void => {
    const next = displayVolume > 0 ? 0 : 1
    setVolumeDraft(next)
    window.api.obs.mediaSetVolume(itemId, next)
  }

  const handleToggleLooping = (): void => {
    const next = !displayLooping
    setLoopingDraft(next)
    window.api.obs.mediaSetLooping(itemId, next)
  }

  return (
    <div className="h-full flex items-center gap-4 px-6">
      {/* 标识 */}
      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
        <FileVideo className="w-4 h-4" />
        <span className="text-sm">本地视频</span>
      </div>

      {/* 播放控制按钮 */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleTogglePlay}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleRestart}
          title="重新开始"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleStop} title="停止">
          <Square className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 ${displayLooping ? 'text-emerald-500 hover:text-emerald-400' : ''}`}
          onClick={handleToggleLooping}
          title={displayLooping ? '循环播放：开' : '循环播放：关'}
        >
          <Repeat className="w-4 h-4" />
        </Button>
      </div>

      {/* 进度条 */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {formatTime(displayTime)}
        </span>
        <input
          type="range"
          min={0}
          max={hasDuration ? duration : 0}
          value={hasDuration ? Math.min(displayTime, duration) : 0}
          disabled={!hasDuration}
          onChange={handleSeekChange}
          onMouseUp={handleSeekCommit}
          onTouchEnd={handleSeekCommit}
          className="flex-1 h-1.5 accent-emerald-500 cursor-pointer disabled:opacity-40"
        />
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      {/* 音量 */}
      <div className="flex items-center gap-2 shrink-0 w-36">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleToggleMute}
          title={displayVolume > 0 ? '静音' : '取消静音'}
        >
          {displayVolume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={displayVolume}
          onChange={handleVolumeChange}
          className="flex-1 h-1.5 accent-emerald-500 cursor-pointer"
        />
      </div>
    </div>
  )
}
