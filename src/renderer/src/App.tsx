/**
 * 主应用组件
 * 启动时等待 OBS 初始化完成，再延迟 3 秒后进入主界面。
 */
import { useState, useEffect } from 'react'
import { Provider } from 'react-redux'
import { Loader2 } from 'lucide-react'
import { store } from './store'
import { useAppDispatch } from '@renderer/store/hooks'
import { setSources, setSelection } from '@renderer/store/slices/sourcesSlice'
import { setStreamState, getRTMPConfig } from '@renderer/store/slices/streamingSlice'
import { setMediaStatus } from '@renderer/store/slices/mediaSlice'
import { SourceList } from '@renderer/components/layout/SourceList'
import { Preview } from '@renderer/components/layout/Preview'
import { ControlBar } from '@renderer/components/layout/ControlBar'

const SOURCE_LIST_WIDTH = 240
const CONTROL_BAR_HEIGHT = 100
const DELAY_AFTER_READY_MS = 3000

function LoadingScreen(): React.JSX.Element {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">正在初始化 OBS...</p>
      </div>
    </div>
  )
}

function MainLayout(): React.JSX.Element {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <div style={{ width: SOURCE_LIST_WIDTH }} className="shrink-0">
        <SourceList />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <Preview />
        </div>
        <div style={{ height: CONTROL_BAR_HEIGHT }} className="shrink-0">
          <ControlBar />
        </div>
      </div>
    </div>
  )
}

function AppContent(): React.JSX.Element {
  const [canShow, setCanShow] = useState(false)
  const dispatch = useAppDispatch()

  // 同步源列表与 RTMP 配置：初始拉取并同步，之后由事件驱动
  useEffect(() => {
    window.api.obs.getSources().then((sources) => dispatch(setSources(sources)))
    dispatch(getRTMPConfig())
    const unsubSources = window.api.obs.onSourcesChanged((sources) => {
      dispatch(setSources(sources))
    })
    // 选中变化走轻量通道，只更新 selected 标记
    const unsubSelection = window.api.obs.onSelectionChanged((selectedId) => {
      dispatch(setSelection(selectedId))
    })
    // 选中媒体源时主进程推送播放进度，回灌到 media slice
    const unsubMedia = window.api.obs.onMediaProgress((status) => {
      dispatch(setMediaStatus(status))
    })
    // 推流状态由主进程依据 OBS 真实输出信号驱动，回灌到 streaming slice
    const unsubStream = window.api.obs.onStreamStateChanged((streamState) => {
      dispatch(setStreamState(streamState))
    })
    return () => {
      unsubSources()
      unsubSelection()
      unsubMedia()
      unsubStream()
    }
  }, [dispatch])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const onReady = (): void => {
      // OBS 初始化完成后再延迟 3 秒进入主界面
      timer = setTimeout(() => setCanShow(true), DELAY_AFTER_READY_MS)
    }

    // 查询当前状态
    window.api.obs.isReady().then((ready) => {
      if (ready) onReady()
    })

    // 监听 OBS 就绪事件
    const unsubscribe = window.api.obs.onReady(() => onReady())

    return () => {
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  if (!canShow) return <LoadingScreen />
  return <MainLayout />
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
