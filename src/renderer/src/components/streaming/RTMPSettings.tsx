/**
 * RTMP 推流设置侧滑面板
 * 用 store 的 server/key 作为初始值，本地编辑，保存时写入 OBS 并更新 store。
 */
import { useState } from 'react'
import { Save, Server, Key } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { SlidePanel } from '@renderer/components/ui/SlidePanel'
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks'
import { setRTMPConfig } from '@renderer/store/slices/streamingSlice'

interface RTMPSettingsProps {
  onClose: () => void
}

export function RTMPSettings({ onClose }: RTMPSettingsProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const storeServer = useAppSelector((state) => state.streaming.server)
  const storeKey = useAppSelector((state) => state.streaming.key)

  const [server, setServer] = useState(storeServer)
  const [key, setKey] = useState(storeKey)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (): Promise<void> => {
    if (!server.trim()) {
      setError('请输入推流地址')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await dispatch(setRTMPConfig({ server: server.trim(), key: key.trim() })).unwrap()
      onClose()
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
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Server className="w-4 h-4 text-muted-foreground" />
            推流地址
          </label>
          <input
            type="text"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            placeholder="rtmp://example.com/live"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">例如：rtmp://live-push.example.com/live</p>
        </div>

        {/* 推流密钥 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Key className="w-4 h-4 text-muted-foreground" />
            推流密钥
          </label>
          <input
            type="password"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            placeholder="your-stream-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">推流密钥可在直播平台后台获取</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="pt-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </SlidePanel>
  )
}
