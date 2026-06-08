/**
 * 添加源侧滑面板
 * 从左侧滑入，覆盖源列表区域。
 * 视频类源（摄像头/显示器/窗口）统一走通用 DeviceList。
 */
import { useState } from 'react'
import { Monitor, Video, Mic, Square, ChevronLeft, FileVideo } from 'lucide-react'
import { SlidePanel } from '@renderer/components/ui/SlidePanel'
import { DeviceList } from './DeviceList'
import { MicrophoneList } from './MicrophoneList'
import { MediaFilePicker } from './MediaFilePicker'
import type { DeviceKind } from '@renderer/lib/deviceCatalog'

interface AddSourceDialogProps {
  onClose: () => void
  onSourceAdded: () => void
}

type SourceTypeKey = DeviceKind | 'microphone' | 'media'

interface SourceTypeOption {
  key: SourceTypeKey
  label: string
  description: string
  icon: React.JSX.Element
  available: boolean
}

const SOURCE_TYPES: SourceTypeOption[] = [
  {
    key: 'monitor',
    label: '屏幕捕获',
    description: '捕获整个显示器屏幕',
    icon: <Monitor className="w-5 h-5" />,
    available: true
  },
  {
    key: 'window',
    label: '窗口捕获',
    description: '捕获特定应用窗口',
    icon: <Square className="w-5 h-5" />,
    available: true
  },
  {
    key: 'camera',
    label: '摄像头',
    description: '捕获摄像头视频',
    icon: <Video className="w-5 h-5" />,
    available: true
  },
  {
    key: 'microphone',
    label: '麦克风',
    description: '捕获麦克风音频',
    icon: <Mic className="w-5 h-5" />,
    available: true
  },
  {
    key: 'media',
    label: '本地视频',
    description: '播放本地视频文件',
    icon: <FileVideo className="w-5 h-5" />,
    available: true
  }
]

export function AddSourceDialog({
  onClose,
  onSourceAdded
}: AddSourceDialogProps): React.JSX.Element {
  const [selectedType, setSelectedType] = useState<SourceTypeKey | null>(null)

  const handleClose = (): void => {
    setSelectedType(null)
    onClose()
  }

  const renderTypeSelector = (): React.JSX.Element => (
    <div className="p-4 space-y-2">
      <p className="text-sm text-zinc-400 mb-4">选择要添加的源类型</p>
      {SOURCE_TYPES.map((type) => (
        <button
          key={type.key}
          disabled={!type.available}
          onClick={() => type.available && setSelectedType(type.key)}
          className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left group
            ${
              type.available
                ? 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 cursor-pointer'
                : 'border-zinc-900 opacity-40 cursor-not-allowed'
            }`}
        >
          <div
            className={`p-2 rounded-lg ${
              type.available ? 'bg-zinc-800 group-hover:bg-zinc-700' : 'bg-zinc-900'
            }`}
          >
            {type.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">{type.label}</span>
              {!type.available && (
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                  即将支持
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{type.description}</p>
          </div>
        </button>
      ))}
    </div>
  )

  return (
    <SlidePanel isOpen={true} onClose={handleClose} title="添加源">
      {selectedType ? (
        <div>
          {/* 返回按钮 */}
          <button
            onClick={() => setSelectedType(null)}
            className="flex items-center gap-1 px-4 py-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors border-b border-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回源类型</span>
          </button>
          {selectedType === 'media' ? (
            <MediaFilePicker onAdded={onSourceAdded} />
          ) : selectedType === 'microphone' ? (
            <MicrophoneList onAdded={onSourceAdded} />
          ) : (
            <DeviceList kind={selectedType} onAdded={onSourceAdded} />
          )}
        </div>
      ) : (
        renderTypeSelector()
      )}
    </SlidePanel>
  )
}
