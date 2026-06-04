/**
 * 推流按钮组件
 *
 * 组件创建后检查 store 中的 server/key，若为空则写入默认值并同步到 OBS。
 */
import { useEffect, useRef } from 'react'
import { Radio, Square, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks'
import { startStreaming, stopStreaming, setRTMPConfig } from '@renderer/store/slices/streamingSlice'

const DEFAULT_SERVER = 'rtmp://127.0.0.1:1935/live'
const DEFAULT_KEY = 'test'

export function StreamButton(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const streamState = useAppSelector((state) => state.streaming.streamState)
  const server = useAppSelector((state) => state.streaming.server)
  const key = useAppSelector((state) => state.streaming.key)
  const checkedRef = useRef(false)

  // 首次挂载时检查，若 server/key 为空则设置默认值
  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    if (!server) {
      dispatch(setRTMPConfig({ server: DEFAULT_SERVER, key: key || DEFAULT_KEY }))
    }
  }, [dispatch, server, key])

  if (streamState === 'connecting') {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        连接中...
      </Button>
    )
  }

  if (streamState === 'streaming') {
    return (
      <Button variant="destructive" className="gap-2" onClick={() => dispatch(stopStreaming())}>
        <Square className="w-4 h-4" />
        停止推流
      </Button>
    )
  }

  return (
    <Button variant="destructive" className="gap-2" onClick={() => dispatch(startStreaming())}>
      <Radio className="w-4 h-4" />
      开始推流
    </Button>
  )
}
