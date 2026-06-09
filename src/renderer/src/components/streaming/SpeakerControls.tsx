/**
 * 扬声器控制组件
 *
 * 扬声器是单例（独立全局输出通道）。展示当前扬声器，支持调节音量（推子）与移除。
 * 状态以 store.speaker.state 为真相（主进程 speaker:changed 回灌）。
 */
import { useCallback } from 'react'
import { Volume2, VolumeX, X } from 'lucide-react'
import { useAppSelector } from '@renderer/store/hooks'

export function SpeakerControls(): React.JSX.Element | null {
  const speaker = useAppSelector((state) => state.speaker.state)

  const handleVolumeChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await window.api.obs.setSpeakerVolume(parseFloat(e.target.value))
  }, [])

  const handleToggleMute = useCallback(async () => {
    if (!speaker) return
    await window.api.obs.setSpeakerMuted(!speaker.muted)
  }, [speaker])

  const handleRemove = useCallback(async () => {
    await window.api.obs.removeSpeaker()
  }, [])

  if (!speaker) return null

  return (
    <div className="flex items-center gap-2">
      {/* 静音按钮 */}
      <button
        onClick={handleToggleMute}
        className={`p-1.5 rounded-md transition-colors ${
          speaker.muted
            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
            : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
        }`}
        title={speaker.muted ? '取消静音' : '静音'}
      >
        {speaker.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={speaker.muted ? 0 : speaker.volume}
        onChange={handleVolumeChange}
        disabled={speaker.muted}
        className="w-20 h-1 accent-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      />
      <span className="text-xs text-zinc-400 truncate max-w-[100px]" title={speaker.deviceName}>
        {speaker.deviceName}
      </span>
      <button
        onClick={handleRemove}
        className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
        title="移除扬声器"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
