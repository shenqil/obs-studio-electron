/**
 * 侧滑面板组件
 * 覆盖父容器区域，从左侧滑入，带有过渡动画
 */
import { X } from 'lucide-react'

interface SlidePanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function SlidePanel({
  isOpen,
  onClose,
  title,
  children
}: SlidePanelProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 animate-in slide-in-from-left duration-300">
      {/* 背景层 - 纯色不透明 */}
      <div className="absolute inset-0 bg-[#1a1a1d]" />

      {/* 内容层 */}
      <div className="relative h-full flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h3 className="text-base font-medium text-zinc-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
