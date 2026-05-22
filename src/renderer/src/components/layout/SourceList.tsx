/**
 * 左侧源列表组件
 * 负责源列表展示、添加、删除
 */
import { useState } from 'react'
import { Video } from 'lucide-react'
import { SourceItem } from '@renderer/components/source/SourceItem'
import { AddSourceDialog } from '@renderer/components/source/AddSourceDialog'
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks'
import { fetchSources, removeSource } from '@renderer/store/slices/sourcesSlice'

export function SourceList(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const sources = useAppSelector((state) => state.sources.sources)
  const [showAddSource, setShowAddSource] = useState(false)

  const handleRemove = (sourceName: string): void => {
    dispatch(removeSource(sourceName))
  }

  const handleSourceAdded = (): void => {
    dispatch(fetchSources())
    setShowAddSource(false)
  }

  return (
    <>
      <div className="h-full flex flex-col bg-card border-r">
        {/* 标题 */}
        <div className="p-4 border-b">
          <h2 className="font-semibold">源列表</h2>
        </div>

        {/* 源列表区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-4">
          {sources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无源</p>
              <p className="text-xs mt-1">点击下方按钮添加</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <SourceItem key={source.name} source={source} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>

        {/* 底部添加按钮 - 固定 */}
        <div className="p-4 border-t">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => setShowAddSource(true)}
          >
            <span>+</span>
            <span>添加源</span>
          </button>
        </div>
      </div>

      {/* 添加源弹窗 */}
      {showAddSource && (
        <AddSourceDialog
          onClose={() => setShowAddSource(false)}
          onSourceAdded={handleSourceAdded}
        />
      )}
    </>
  )
}
