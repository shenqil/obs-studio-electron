/**
 * 主应用组件
 * 布局：左侧源列表 | 右侧(上:预览区 / 下:控制栏)
 */
import { Provider } from 'react-redux'
import { store } from './store'
import { SourceList } from '@renderer/components/layout/SourceList'
import { Preview } from '@renderer/components/layout/Preview'
import { ControlBar } from '@renderer/components/layout/ControlBar'

// 布局尺寸常量
const SOURCE_LIST_WIDTH = 240
const CONTROL_BAR_HEIGHT = 100

function AppContent(): React.JSX.Element {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* 左侧：源列表 */}
      <div style={{ width: SOURCE_LIST_WIDTH }} className="shrink-0">
        <SourceList />
      </div>

      {/* 右侧：上下布局 */}
      <div className="flex-1 flex flex-col">
        {/* 右上：预览区域 */}
        <div className="flex-1">
          <Preview />
        </div>

        {/* 右下：控制栏 */}
        <div style={{ height: CONTROL_BAR_HEIGHT }} className="shrink-0">
          <ControlBar />
        </div>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
