import { Image, Box, ArrowUpDown } from 'lucide-react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function ViewerToolbar() {
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const selectedDesignId = useAppStore((s) => s.selectedDesignId)
  const togglePanelSwap = useAppStore((s) => s.togglePanelSwap)
  const panelsSwapped = useAppStore((s) => s.panelsSwapped)

  return (
    <div className="flex items-center justify-between px-3 h-9 border-b border-border bg-card/50 shrink-0">
      <div className="flex items-center gap-2">
        {selectedDesignId && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
            {selectedDesignId}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5 bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 rounded-sm',
              viewMode === '2d' && 'bg-background shadow-sm'
            )}
            onClick={() => setViewMode('2d')}
          >
            <Image className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 rounded-sm',
              viewMode === '3d' && 'bg-background shadow-sm'
            )}
            onClick={() => setViewMode('3d')}
          >
            <Box className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-6 w-6', panelsSwapped && 'text-foreground')}
              onClick={togglePanelSwap}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Swap viewer &amp; chart</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
