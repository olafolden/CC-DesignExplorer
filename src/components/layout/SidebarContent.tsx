import { Upload, FolderOpen, Palette, Filter, Info } from 'lucide-react'
import { useAppStore } from '@/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'

function SidebarSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 px-1">
        {label}
      </p>
      {children}
    </div>
  )
}

function PlaceholderSlot({
  icon: Icon,
  label,
  phase,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  phase: number
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-muted-foreground/50">
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs truncate">{label}</p>
        <p className="text-[10px]">Phase {phase}</p>
      </div>
    </div>
  )
}

function CollapsedIcons() {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <ThemeToggle iconOnly />
      <Separator className="my-1 w-6" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Upload className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Data upload (Phase 3)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <FolderOpen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Asset upload (Phase 3)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Palette className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Color metric (Phase 6)</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function SidebarContent() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  if (collapsed) return <CollapsedIcons />

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 p-3">
        <ThemeToggle />

        <Separator />

        <SidebarSection label="Data">
          <PlaceholderSlot icon={Upload} label="Drop data.json" phase={3} />
          <PlaceholderSlot icon={FolderOpen} label="Drop asset folder" phase={3} />
        </SidebarSection>

        <Separator />

        <SidebarSection label="Visualization">
          <PlaceholderSlot icon={Palette} label="Color metric" phase={6} />
          <PlaceholderSlot icon={Filter} label="Active filters" phase={6} />
        </SidebarSection>

        <Separator />

        <SidebarSection label="Selection">
          <PlaceholderSlot icon={Info} label="Design details" phase={6} />
        </SidebarSection>
      </div>
    </ScrollArea>
  )
}
