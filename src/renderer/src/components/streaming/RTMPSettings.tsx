/**
 * RTMP 设置弹窗组件
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save } from 'lucide-react'
import { useAppDispatch } from '@renderer/store/hooks'
import { setRTMPConfig, getRTMPConfig } from '@renderer/store/slices/streamingSlice'

// 默认 RTMP 配置
const DEFAULT_RTMP_CONFIG = {
  server: 'rtmp://localhost:1935/live',
  key: 'test'
}

interface RTMPSettingsProps {
  onClose: () => void
}

export function RTMPSettings({ onClose }: RTMPSettingsProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const [server, setServer] = useState(DEFAULT_RTMP_CONFIG.server)
  const [key, setKey] = useState(DEFAULT_RTMP_CONFIG.key)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取当前配置
  useEffect(() => {
    dispatch(getRTMPConfig()).then((result) => {
      if (getRTMPConfig.fulfilled.match(result) && result.payload) {
        setServer(result.payload.server || DEFAULT_RTMP_CONFIG.server)
        setKey(result.payload.key || DEFAULT_RTMP_CONFIG.key)
      }
    })
  }, [dispatch])

  const handleSave = async (): Promise<void> => {
    if (!server.trim()) {
      setError('请输入推流地址')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const result = await dispatch(setRTMPConfig({ server: server.trim(), key: key.trim() }))
      if (setRTMPConfig.fulfilled.match(result)) {
        onClose()
      } else {
        setError('保存失败，请重试')
      }
    } catch {
      setError('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 弹窗内容 */}
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">推流设置</h3>
          <button className="p-2 hover:bg-secondary rounded-md transition-colors" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">推流地址 (RTMP URL)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="rtmp://example.com/live"
              value={server}
              onChange={(e) => setServer(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">例如：rtmp://live-push.example.com/live</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">推流密钥 (Stream Key)</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your-stream-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">推流密钥可在直播平台后台获取</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            className="px-4 py-2 border rounded-md hover:bg-secondary transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>保存</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
