/**
 * 添加源弹窗组件
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Monitor, Video, Mic, Square, X } from 'lucide-react'
import { CameraList } from './CameraList'
import { MonitorList } from './MonitorList'

interface AddSourceDialogProps {
  onClose: () => void
  onSourceAdded: () => void
}

type SourceTypeKey = 'screen' | 'window' | 'camera' | 'microphone'

const SOURCE_TYPES: {
  key: SourceTypeKey
  label: string
  icon: React.JSX.Element
  available: boolean
}[] = [
  { key: 'screen', label: '屏幕捕获', icon: <Monitor className="w-5 h-5" />, available: true },
  { key: 'window', label: '窗口捕获', icon: <Square className="w-5 h-5" />, available: false },
  { key: 'camera', label: '摄像头', icon: <Video className="w-5 h-5" />, available: true },
  { key: 'microphone', label: '麦克风', icon: <Mic className="w-5 h-5" />, available: false }
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

  const handleSourceAdded = (): void => {
    onSourceAdded()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">添加源</h3>
          <button
            className="p-2 hover:bg-secondary rounded-md transition-colors"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {!selectedType ? (
            <div className="grid grid-cols-2 gap-3">
              {SOURCE_TYPES.map((type) => (
                <button
                  key={type.key}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors
                    ${type.available ? 'hover:bg-secondary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => type.available && setSelectedType(type.key)}
                  disabled={!type.available}
                >
                  {type.icon}
                  <span className="text-sm">{type.label}</span>
                  {!type.available && (
                    <span className="text-xs text-muted-foreground">即将支持</span>
                  )}
                </button>
              ))}
            </div>
          ) : selectedType === 'camera' ? (
            <div>
              <button
                className="mb-2 px-3 py-1 text-sm hover:bg-secondary rounded-md transition-colors"
                onClick={() => setSelectedType(null)}
              >
                ← 返回
              </button>
              <CameraList onAdded={handleSourceAdded} />
            </div>
          ) : selectedType === 'screen' ? (
            <div>
              <button
                className="mb-2 px-3 py-1 text-sm hover:bg-secondary rounded-md transition-colors"
                onClick={() => setSelectedType(null)}
              >
                ← 返回
              </button>
              <MonitorList onAdded={handleSourceAdded} />
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}
