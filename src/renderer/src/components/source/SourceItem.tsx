/**
 * 源项组件
 */
import { X, Video } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import type { SourceInfo } from '@renderer/types/obs'

interface SourceItemProps {
  source: SourceInfo
  onRemove: (id: string) => void
}

export function SourceItem({ source, onRemove }: SourceItemProps): React.JSX.Element {
  const getIcon = (): React.JSX.Element => {
    switch (source.type) {
      case 'camera':
        return <Video className="w-4 h-4" />
      default:
        return <Video className="w-4 h-4" />
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">{getIcon()}</div>
        <div>
          <p className="font-medium text-sm">{source.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{source.type}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={() => onRemove(source.name)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
