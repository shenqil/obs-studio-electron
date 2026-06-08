/**
 * 麦克风控制组件
 *
 * 展示已添加的麦克风源，支持调节音量和静音切换。
 */
import { useState, useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'
import type { SourceInfo } from '@renderer/types/obs'

interface MicControlsProps {
  micSources: SourceInfo[]
}

export function MicControls({ micSources }: MicControlsProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      {micSources.map((mic) => (
        <MicControlItem key={mic.id} mic={mic} />
      ))}
    </div>
  )
}

function MicControlItem({ mic }: { mic: SourceInfo }): React.JSX.Element {
  const [volume, setVolume] = useState(1)

  const handleMuteToggle = useCallback(async () => {
    await window.api.obs.setSourceMuted(mic.id, !mic.muted)
  }, [mic.id, mic.muted])

  const handleVolumeChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value)
      setVolume(newVolume)
      await window.api.obs.setMicVolume(mic.id, newVolume)
    },
    [mic.id]
  )

  // 初始化时获取当前音量
  useState(() => {
    window.api.obs.getMicVolume(mic.id).then((v) => setVolume(v))
  })

  return (
    <div className="flex items-center gap-2">
      {/* 静音按钮 */}
      <button
        onClick={handleMuteToggle}
        className={`p-1.5 rounded-md transition-colors ${
          mic.muted
            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
            : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
        }`}
        title={mic.muted ? '取消静音' : '静音'}
      >
        {mic.muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* 音量滑块 */}
      <div className="flex items-center gap-1.5">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={mic.muted ? 0 : volume}
          onChange={handleVolumeChange}
          disabled={mic.muted}
          className="w-20 h-1 accent-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      {/* 麦克风名称 */}
      <span className="text-xs text-zinc-400 truncate max-w-[100px]" title={mic.sourceName}>
        {mic.sourceName}
      </span>
    </div>
  )
}
