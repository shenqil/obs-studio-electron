/**
 * 左侧源列表组件
 */
import { useState } from 'react'
import { Video, Settings, Plus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { SourceItem } from '@renderer/components/source/SourceItem'
import { AddSourceDialog } from '@renderer/components/source/AddSourceDialog'
import { RTMPSettings } from '@renderer/components/streaming/RTMPSettings'
import { useAppSelector } from '@renderer/store/hooks'

export function SourceList(): React.JSX.Element {
  const sources = useAppSelector((state) => state.sources.sources)
  const [showAddSource, setShowAddSource] = useState(false)
  const [showRTMPSettings, setShowRTMPSettings] = useState(false)

  const handleSourceAdded = (): void => {
    setShowAddSource(false)
  }

  return (
    <div className="h-full relative">
      <div className="h-full flex flex-col bg-card border-r border-border">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">源列表</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowRTMPSettings(true)}
            title="推流设置"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* 源列表 */}
        <div className="flex-1 overflow-y-auto">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4">
              <Video className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">暂无源</p>
              <p className="text-xs mt-1">点击下方按钮添加</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sources.map((source) => (
                <SourceItem key={source.id} source={source} />
              ))}
            </div>
          )}
        </div>

        {/* 底部添加按钮 */}
        <div className="p-3 border-t border-border">
          <Button className="w-full gap-2" onClick={() => setShowAddSource(true)}>
            <Plus className="w-4 h-4" />
            添加源
          </Button>
        </div>
      </div>

      {/* 侧滑面板 */}
      {showAddSource && (
        <AddSourceDialog
          onClose={() => setShowAddSource(false)}
          onSourceAdded={handleSourceAdded}
        />
      )}
      {showRTMPSettings && <RTMPSettings onClose={() => setShowRTMPSettings(false)} />}
    </div>
  )
}
