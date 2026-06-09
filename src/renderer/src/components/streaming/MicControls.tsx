/**
 * 麦克风控制组件
 *
 * 展示已添加的麦克风源，支持调节音量、静音切换、切换设备、删除设备。
 * 麦克风不在左侧源列表展示，统一在此（底部控制栏）管理。
 */
import { useState, useCallback } from 'react'
import { Mic, MicOff, Repeat, Trash2 } from 'lucide-react'
import { SwitchDeviceDialog } from '@renderer/components/source/SwitchDeviceDialog'
import type { SourceInfo } from '@renderer/types/obs'

interface MicControlsProps {
  micSources: SourceInfo[]
}

export function MicControls({ micSources }: MicControlsProps): React.JSX.Element {
  // 正在切换设备的麦克风（非空时弹出切换设备面板）
  const [switchMic, setSwitchMic] = useState<SourceInfo | null>(null)

  return (
    <div className="flex items-center gap-3">
      {micSources.map((mic) => (
        <MicControlItem key={mic.id} mic={mic} onSwitchDevice={setSwitchMic} />
      ))}

      {/* 切换设备面板：固定全屏覆盖，SlidePanel 在其内 absolute 填满 */}
      {switchMic && (
        <div className="fixed inset-0 z-50">
          <SwitchDeviceDialog source={switchMic} onClose={() => setSwitchMic(null)} />
        </div>
      )}
    </div>
  )
}

function MicControlItem({
  mic,
  onSwitchDevice
}: {
  mic: SourceInfo
  onSwitchDevice: (mic: SourceInfo) => void
}): React.JSX.Element {
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

  const handleRemove = useCallback(async () => {
    await window.api.obs.removeSource(mic.id)
  }, [mic.id])

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

      {/* 麦克风名称 */}
      <span className="text-xs text-zinc-400 truncate max-w-[100px]" title={mic.sourceName}>
        {mic.sourceName}
      </span>

      {/* 切换设备 */}
      <button
        onClick={() => onSwitchDevice(mic)}
        className="p-1.5 rounded-md text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        title="切换设备"
      >
        <Repeat className="w-4 h-4" />
      </button>

      {/* 删除设备 */}
      <button
        onClick={handleRemove}
        className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
        title="删除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
