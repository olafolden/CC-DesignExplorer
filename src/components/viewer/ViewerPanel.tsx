import { Box, MousePointerClick } from 'lucide-react'
import { useAppStore } from '@/store'
import { useColorScale } from '@/hooks/useColorScale'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ViewerToolbar } from './ViewerToolbar'
import { ImageViewer } from './ImageViewer'
import { ModelViewer } from './ModelViewer'

function EmptyState() {
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)

  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
      <Box className="h-16 w-16 mb-4 opacity-15 stroke-[1.2]" />
      <p className="text-sm font-medium">
        {isDataLoaded ? 'No design selected' : '2D / 3D Viewer'}
      </p>
      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground/60">
        <MousePointerClick className="h-3 w-3" />
        <p className="text-xs">
          {isDataLoaded
            ? 'Click a line in the chart to preview'
            : 'Load data to get started'}
        </p>
      </div>
    </div>
  )
}

export function ViewerPanel() {
  const viewMode = useAppStore((s) => s.viewMode)
  const selectedDesignId = useAppStore((s) => s.selectedDesignId)
  const hoveredDesignId = useAppStore((s) => s.hoveredDesignId)
  const assetMap = useAppStore((s) => s.assetMap)
  const rawData = useAppStore((s) => s.rawData)
  const colorMetricKey = useAppStore((s) => s.colorMetricKey)
  const colorScale = useColorScale()

  const activeId = hoveredDesignId ?? selectedDesignId

  // Get the color for this design based on the color metric
  let designColor: string | undefined
  if (activeId && colorScale && colorMetricKey) {
    const row = rawData.find((d) => d.id === activeId)
    if (row) {
      const val = row[colorMetricKey]
      if (typeof val === 'number') {
        designColor = colorScale.getColorForValue(val)
      }
    }
  }

  const assets = activeId ? assetMap[activeId] : undefined

  if (!activeId) {
    return (
      <div className="flex flex-col h-full">
        <ViewerToolbar />
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ViewerToolbar />
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          {viewMode === '2d' ? (
            <ImageViewer
              imageUrl={assets?.imageUrl ?? null}
              designId={activeId}
            />
          ) : (
            <ModelViewer
              modelUrl={assets?.modelUrl ?? null}
              designId={activeId}
              color={designColor}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  )
}
