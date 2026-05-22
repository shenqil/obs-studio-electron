/**
 * 预览区域组件
 * 负责预览展示、推流状态监听
 */
import { useEffect } from 'react'
import { Video } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks'
import { setStreamState, setStreamError } from '@renderer/store/slices/streamingSlice'
import { fetchSources } from '@renderer/store/slices/sourcesSlice'
import type { OBSSignal } from '@renderer/types/obs'

export function Preview(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const streamState = useAppSelector((state) => state.streaming.streamState)
  const sources = useAppSelector((state) => state.sources.sources)

  // 初始化
  useEffect(() => {
    dispatch(fetchSources())
  }, [dispatch])

  // 监听推流状态变化
  useEffect(() => {
    const unsubscribe = window.api.obs.onStreamStateChanged((signal: OBSSignal) => {
      console.log('Stream state changed:', signal)
      switch (signal.type) {
        case 'streaming_started':
          dispatch(setStreamState('streaming'))
          break
        case 'streaming_stopped':
          dispatch(setStreamState('idle'))
          break
        case 'streaming_starting':
          dispatch(setStreamState('connecting'))
          break
        case 'error':
          dispatch(setStreamError(signal.error || 'Unknown error'))
          break
      }
    })

    return unsubscribe
  }, [dispatch])

  const isStreaming = streamState === 'streaming' || streamState === 'connecting'
  const hasSources = sources.length > 0

  return (
    <div className="h-full flex flex-col bg-black relative">
      {/* 预览区域 */}
      <div className="flex-1 flex items-center justify-center">
        {hasSources ? (
          // 有源时显示预览占位
          // 实际预览需要 OBS 的 Display 功能，这里暂时显示占位符
          <div className="text-center text-white/70">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">预览区域</p>
            <p className="text-sm text-white/50 mt-1">OBS 预览功能需要额外配置 Display 输出</p>
          </div>
        ) : (
          <div className="text-center text-white/70">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无预览</p>
            <p className="text-sm text-white/50 mt-1">请添加摄像头或其他源</p>
          </div>
        )}
      </div>

      {/* 推流状态指示器 */}
      {isStreaming && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1.5 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="text-sm font-medium">
            {streamState === 'connecting' ? '连接中' : '直播中'}
          </span>
        </div>
      )}
    </div>
  )
}
