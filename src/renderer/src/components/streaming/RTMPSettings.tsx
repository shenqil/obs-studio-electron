/**
 * RTMP 推流设置侧滑面板
 */
import { useState, useEffect } from 'react'
import { Save, Server, Key } from 'lucide-react'
import { SlidePanel } from '@renderer/components/ui/SlidePanel'
import { useAppDispatch } from '@renderer/store/hooks'
import { setRTMPConfig, getRTMPConfig } from '@renderer/store/slices/streamingSlice'

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

  return (
    <SlidePanel isOpen={true} onClose={onClose} title="推流设置">
      <div className="p-4 space-y-6">
        {/* 推流地址 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Server className="w-4 h-4 text-zinc-500" />
            推流地址
          </label>
          <input
            type="text"
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            placeholder="rtmp://example.com/live"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
          <p className="text-xs text-zinc-500">例如：rtmp://live-push.example.com/live</p>
        </div>

        {/* 推流密钥 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Key className="w-4 h-4 text-zinc-500" />
            推流密钥
          </label>
          <input
            type="password"
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            placeholder="your-stream-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <p className="text-xs text-zinc-500">推流密钥可在直播平台后台获取</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="px-3 py-2 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg">
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                <span> ...</span>
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
    </SlidePanel>
  )
}
