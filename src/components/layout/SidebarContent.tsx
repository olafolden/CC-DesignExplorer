import { useAppStore } from '@/store'
import { ScrollArea } from '@/components/ui/scroll-area'

export function SidebarContent() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  if (collapsed) return null

  return (
    <ScrollArea className="flex-1 px-3 py-4">
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Drop Zone (Phase 3)
        </div>
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Metric Selector (Phase 6)
        </div>
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Filter Summary (Phase 6)
        </div>
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Design Info (Phase 6)
        </div>
      </div>
    </ScrollArea>
  )
}
