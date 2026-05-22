/**
 * 底部控制栏组件
 * 负责音频源展示和预览控制
 */
import { useState } from 'react'
import { Mic, Eye, Grid3X3 } from 'lucide-react'
import { StreamButton } from '@renderer/components/streaming/StreamButton'
import { Button } from '@renderer/components/ui/button'

export function ControlBar(): React.JSX.Element {
  const [drawUI, setDrawUI] = useState(true)
  const [drawGuideLines, setDrawGuideLines] = useState(true)

  const handleToggleDrawUI = async (): Promise<void> => {
    const newValue = !drawUI
    setDrawUI(newValue)
    await window.api.obs.setShouldDrawUI(newValue)
  }

  const handleToggleGuideLines = async (): Promise<void> => {
    const newValue = !drawGuideLines
    setDrawGuideLines(newValue)
    await window.api.obs.setDrawGuideLines(newValue)
  }

  return (
    <div className="h-full flex bg-card border-t">
      {/* 左侧：音频列表区域 */}
      <div className="flex-1 border-r p-4 overflow-y-auto">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mic className="w-4 h-4" />
          <span className="text-sm">音频源</span>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          <p>暂无音频源</p>
          <p className="text-xs mt-1">添加麦克风后在列表中显示</p>
        </div>
      </div>

      {/* 中间：预览控制 */}
      <div className="flex items-center gap-2 px-4 border-r">
        <Button
          variant={drawUI ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleDrawUI}
          title={drawUI ? '隐藏预览 UI' : '显示预览 UI'}
        >
          <Eye className={`w-4 h-4 ${drawUI ? '' : 'opacity-50'}`} />
        </Button>
        <Button
          variant={drawGuideLines ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleGuideLines}
          title={drawGuideLines ? '隐藏参考线' : '显示参考线'}
        >
          <Grid3X3 className={`w-4 h-4 ${drawGuideLines ? '' : 'opacity-50'}`} />
        </Button>
      </div>

      {/* 右侧：推流控制 */}
      <div className="flex items-center justify-center px-6">
        <StreamButton />
      </div>
    </div>
  )
}
