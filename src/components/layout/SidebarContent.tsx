import { Upload, FolderOpen, Palette } from 'lucide-react'
import { useAppStore } from '@/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { DropZone } from '@/components/ingestion/DropZone'
import { AssetDropZone } from '@/components/ingestion/AssetDropZone'
import { DataSummary } from '@/components/ingestion/DataSummary'
import { MetricSelector } from '@/components/controls/MetricSelector'
import { FilterSummary } from '@/components/controls/FilterSummary'
import { DesignInfo } from '@/components/controls/DesignInfo'
import { DesignSelector } from '@/components/controls/DesignSelector'

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


function CollapsedIcons() {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <ThemeToggle iconOnly />
      <Separator className="my-1 w-6" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Upload className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Data upload</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <FolderOpen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Asset upload</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Palette className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Color metric</TooltipContent>
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
          <DropZone />
          <AssetDropZone />
          <DataSummary />
        </SidebarSection>

        <Separator />

        <SidebarSection label="Visualization">
          <MetricSelector />
          <FilterSummary />
        </SidebarSection>

        <Separator />

        <SidebarSection label="Selection">
          <DesignSelector />
          <DesignInfo />
        </SidebarSection>
      </div>
    </ScrollArea>
  )
}
