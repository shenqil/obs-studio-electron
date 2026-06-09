/**
 * 扬声器控制组件
 *
 * 展示已添加的扬声器源，仅支持调节音量（推子）。
 */
import { useState, useCallback } from 'react'
import { Volume2 } from 'lucide-react'
import type { SourceInfo } from '@renderer/types/obs'

interface SpeakerControlsProps {
  speakerSources: SourceInfo[]
}

export function SpeakerControls({ speakerSources }: SpeakerControlsProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      {speakerSources.map((sp) => (
        <SpeakerControlItem key={sp.id} speaker={sp} />
      ))}
    </div>
  )
}

function SpeakerControlItem({ speaker }: { speaker: SourceInfo }): React.JSX.Element {
  const [volume, setVolume] = useState(1)

  const handleVolumeChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value)
      setVolume(newVolume)
      await window.api.obs.setSpeakerVolume(speaker.id, newVolume)
    },
    [speaker.id]
  )

  // 初始化时获取当前音量
  useState(() => {
    window.api.obs.getSpeakerVolume(speaker.id).then((v) => setVolume(v))
  })

  return (
    <div className="flex items-center gap-2">
      <Volume2 className="w-4 h-4 shrink-0 text-zinc-300" />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="w-20 h-1 accent-blue-500 cursor-pointer"
      />
      <span className="text-xs text-zinc-400 truncate max-w-[100px]" title={speaker.sourceName}>
        {speaker.sourceName}
      </span>
    </div>
  )
}
