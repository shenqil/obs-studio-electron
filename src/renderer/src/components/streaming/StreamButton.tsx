/**
 * 推流按钮组件
 * 负责推流控制、RTMP设置
 */
import { useState } from 'react'
import { Radio, Square, Loader2, Settings } from 'lucide-react'
import { RTMPSettings } from './RTMPSettings'
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks'
import { startStreaming, stopStreaming } from '@renderer/store/slices/streamingSlice'

export function StreamButton(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const streamState = useAppSelector((state) => state.streaming.streamState)
  const [showRTMPSettings, setShowRTMPSettings] = useState(false)

  const isStreaming = streamState === 'streaming'
  const isConnecting = streamState === 'connecting'
  const isIdle = streamState === 'idle'
  const hasError = streamState === 'error'

  const handleStart = (): void => {
    dispatch(startStreaming())
  }

  const handleStop = (): void => {
    dispatch(stopStreaming())
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-secondary rounded-md transition-colors"
          onClick={() => setShowRTMPSettings(true)}
          title="推流设置"
          disabled={isStreaming || isConnecting}
        >
          <Settings className="w-4 h-4" />
        </button>

        {isIdle || hasError ? (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
            onClick={handleStart}
          >
            <Radio className="w-4 h-4" />
            <span>开始推流</span>
          </button>
        ) : isConnecting ? (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md"
            disabled
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>连接中...</span>
          </button>
        ) : (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            onClick={handleStop}
          >
            <Square className="w-4 h-4" />
            <span>停止推流</span>
          </button>
        )}
      </div>

      {/* RTMP 设置弹窗 */}
      {showRTMPSettings && <RTMPSettings onClose={() => setShowRTMPSettings(false)} />}
    </>
  )
}
