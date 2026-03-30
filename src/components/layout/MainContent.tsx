'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { BarChart3, Loader2, MousePointerClick } from 'lucide-react'
import { useAppStore } from '@/store'
import { Skeleton } from '@/components/ui/skeleton'
import { ResizeHandle } from './ResizeHandle'
import { ViewerPanel } from '@/components/viewer/ViewerPanel'

const ParallelCoordinates = dynamic(
  () => import('@/components/chart/ParallelCoordinates'),
  { ssr: false }
)

const MIN_PANEL_HEIGHT = 120
const DEFAULT_CHART_RATIO = 0.4

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

function HydrationSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none gap-3">
      <Loader2 className="h-8 w-8 animate-spin opacity-30" />
      <p className="text-sm">Loading your workspace...</p>
      <div className="w-48 space-y-2 mt-2">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-3/4" />
        <Skeleton className="h-2 w-1/2" />
      </div>
    </div>
  )
}

export function MainContent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartRatio, setChartRatio] = useState(DEFAULT_CHART_RATIO)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)
  const isHydrating = useAppStore((s) => s.isHydrating)
  const panelsSwapped = useAppStore((s) => s.panelsSwapped)

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

  const viewerPanel = (
    <div
      key="viewer"
      className="overflow-hidden bg-background"
      style={{ flex: `${panelsSwapped ? chartRatio : 1 - chartRatio} 1 0%` }}
    >
      <ViewerPanel />
    </div>
  )

  const chartPanel = (
    <div
      key="chart"
      className="overflow-hidden border-t border-border bg-card"
      style={{ flex: `${panelsSwapped ? 1 - chartRatio : chartRatio} 1 0%` }}
    >
      {isHydrating ? <HydrationSkeleton /> : isDataLoaded ? <ParallelCoordinates /> : <ChartEmpty />}
    </div>
  )

  return (
    <main ref={containerRef} className="flex flex-1 flex-col overflow-hidden">
      {panelsSwapped ? chartPanel : viewerPanel}
      <ResizeHandle onResize={handleResize} />
      {panelsSwapped ? viewerPanel : chartPanel}
    </main>
  )
}
