/**
 * 本地视频文件选择组件
 *
 * 点击按钮打开系统文件选择对话框，过滤视频文件，选中后调用 addMedia 添加为源。
 */
import { useState } from 'react'
import { FileVideo, Loader2 } from 'lucide-react'

interface MediaFilePickerProps {
  onAdded: () => void
}

/** 支持的视频文件扩展名过滤 */
const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'ts', 'm4v']

export function MediaFilePicker({ onAdded }: MediaFilePickerProps): React.JSX.Element {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleSelectFile = async (): Promise<void> => {
    if (isAdding) return

    try {
      // 使用 Electron 的 dialog 打开文件选择
      const result = await window.electron.ipcRenderer.invoke('dialog:openFile', {
        title: '选择视频文件',
        filters: [
          {
            name: '视频文件',
            extensions: VIDEO_EXTENSIONS
          }
        ],
        properties: ['openFile']
      })

      if (!result || result.canceled || !result.filePaths?.length) return

      const filePath = result.filePaths[0]
      // 从路径中提取文件名作为显示名
      const fileName = filePath.split(/[/\\]/).pop() ?? '本地视频'

      setSelectedFile(fileName)
      setIsAdding(true)

      const itemId = await window.api.obs.addMedia({ id: filePath, name: fileName })
      if (itemId !== null) {
        onAdded()
      }
    } catch (err) {
      console.error('Failed to add media source:', err)
    } finally {
      setIsAdding(false)
      setSelectedFile(null)
    }
  }

  return (
    <div className="p-4">
      <h4 className="text-sm font-medium text-zinc-300 mb-3">添加本地视频</h4>
      <p className="text-xs text-zinc-500 mb-4">支持格式：{VIDEO_EXTENSIONS.join('、')}</p>

      <button
        onClick={handleSelectFile}
        disabled={isAdding}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 text-zinc-300 hover:text-zinc-100 transition-all"
      >
        {isAdding ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">正在添加：{selectedFile}</span>
          </>
        ) : (
          <>
            <FileVideo className="w-5 h-5" />
            <span className="text-sm">选择视频文件</span>
          </>
        )}
      </button>
    </div>
  )
}
