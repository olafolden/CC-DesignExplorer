import { useCallback, useRef, useState } from 'react'
import { Box, BarChart3, MousePointerClick } from 'lucide-react'
import { useAppStore } from '@/store'
import { ResizeHandle } from './ResizeHandle'
import { ParallelCoordinates } from '@/components/chart/ParallelCoordinates'

const MIN_PANEL_HEIGHT = 120
const DEFAULT_CHART_RATIO = 0.4

function ViewerEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
      <Box className="h-16 w-16 mb-4 opacity-15 stroke-[1.2]" />
      <p className="text-sm font-medium">2D / 3D Viewer</p>
      <p className="text-xs mt-1 text-muted-foreground/60">
        Select a design from the chart to preview
      </p>
    </div>
  )
}

function ChartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
      <BarChart3 className="h-16 w-16 mb-4 opacity-15 stroke-[1.2]" />
      <p className="text-sm font-medium">Parallel Coordinates</p>
      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground/60">
        <MousePointerClick className="h-3 w-3" />
        <p className="text-xs">Load data to explore designs</p>
      </div>
    </div>
  )
}

export function MainContent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartRatio, setChartRatio] = useState(DEFAULT_CHART_RATIO)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)

  const handleResize = useCallback(
    (deltaY: number) => {
      const container = containerRef.current
      if (!container) return

      const totalHeight = container.clientHeight
      const minRatio = MIN_PANEL_HEIGHT / totalHeight
      const maxRatio = 1 - minRatio

      setChartRatio((prev) => {
        const newRatio = prev - deltaY / totalHeight
        return Math.max(minRatio, Math.min(maxRatio, newRatio))
      })
    },
    []
  )

  return (
    <main ref={containerRef} className="flex flex-1 flex-col overflow-hidden">
      {/* Viewer area */}
      <div
        className="overflow-hidden bg-background"
        style={{ flex: `${1 - chartRatio} 1 0%` }}
      >
        <ViewerEmpty />
      </div>

      <ResizeHandle onResize={handleResize} />

      {/* Chart area */}
      <div
        className="overflow-hidden border-t border-border bg-card"
        style={{ flex: `${chartRatio} 1 0%` }}
      >
        {isDataLoaded ? <ParallelCoordinates /> : <ChartEmpty />}
      </div>
    </main>
  )
}
