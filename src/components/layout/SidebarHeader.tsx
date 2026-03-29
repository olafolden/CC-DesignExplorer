import { PanelLeftClose, PanelLeftOpen, Compass } from 'lucide-react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function SidebarHeader() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <div className="flex items-center h-12 px-2 border-b border-border shrink-0">
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 mx-auto" onClick={toggleSidebar}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0 pl-1">
            <Compass className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold tracking-tight truncate">
              Design Explorer
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggleSidebar}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
