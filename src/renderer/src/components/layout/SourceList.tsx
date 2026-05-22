/**
 * 左侧源列表组件
 * 负责源列表展示、添加和推流设置
 */
import { useState } from 'react'
import { Video, Settings } from 'lucide-react'
import { SourceItem } from '@renderer/components/source/SourceItem'
import { AddSourceDialog } from '@renderer/components/source/AddSourceDialog'
import { RTMPSettings } from '@renderer/components/streaming/RTMPSettings'
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks'
import { fetchSources } from '@renderer/store/slices/sourcesSlice'

export function SourceList(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const sources = useAppSelector((state) => state.sources.sources)
  const [showAddSource, setShowAddSource] = useState(false)
  const [showRTMPSettings, setShowRTMPSettings] = useState(false)

  const handleSourceAdded = (): void => {
    dispatch(fetchSources())
    setShowAddSource(false)
  }

  return (
    <div className="h-full relative">
      {/* 主内容区域 */}
      <div className="h-full flex flex-col bg-[#1a1a1d] border-r border-zinc-800">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">源列表</h2>
          <button
            onClick={() => setShowRTMPSettings(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
            title="推流设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* 源列表区域 */}
        <div className="flex-1 overflow-y-auto">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 px-4">
              <Video className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">暂无源</p>
              <p className="text-xs mt-1">点击下方按钮添加</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sources.map((source) => (
                <SourceItem key={source.sourceName} source={source} />
              ))}
            </div>
          )}
        </div>

        {/* 底部添加按钮 */}
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={() => setShowAddSource(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            <span>添加源</span>
          </button>
        </div>
      </div>

      {/* 添加源侧滑面板 */}
      {showAddSource && (
        <AddSourceDialog
          onClose={() => setShowAddSource(false)}
          onSourceAdded={handleSourceAdded}
        />
      )}

      {/* 推流设置侧滑面板 */}
      {showRTMPSettings && <RTMPSettings onClose={() => setShowRTMPSettings(false)} />}
    </div>
  )
}
