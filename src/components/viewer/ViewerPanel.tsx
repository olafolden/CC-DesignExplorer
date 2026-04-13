'use client'

import dynamic from 'next/dynamic'
import { Box, MousePointerClick } from 'lucide-react'
import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'
import { useAssetUrls } from '@/hooks/queries/use-asset-urls'
import { useColorScale } from '@/hooks/useColorScale'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ViewerToolbar } from './ViewerToolbar'
import { ImageViewer } from './ImageViewer'
import { CatalogueView } from './CatalogueView'

const ModelViewer = dynamic(
  () => import('@/components/viewer/ModelViewer'),
  { ssr: false }
)

function EmptyState() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const { isSuccess: isDataLoaded } = useDataset(currentDatasetId)

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
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const colorMetricKey = useAppStore((s) => s.colorMetricKey)
  const colorScale = useColorScale()

  const { data: datasetResponse } = useDataset(currentDatasetId)
  const rawData = datasetResponse?.data ?? []
  const { data: assetMap = {} } = useAssetUrls(currentDatasetId)

  const activeCategory = useAppStore((s) => s.activeCategory)
  const activeId = hoveredDesignId ?? selectedDesignId

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
  const modelUrls = assets?.modelUrls ?? {}
  const availableCategories = Object.keys(modelUrls)
  const modelUrl = modelUrls[activeCategory] ?? modelUrls['default'] ?? Object.values(modelUrls)[0] ?? null

  if (viewMode === 'catalogue') {
    return (
      <div className="flex flex-col h-full">
        <ViewerToolbar availableCategories={availableCategories} />
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary>
            <CatalogueView />
          </ErrorBoundary>
        </div>
      </div>
    )
  }

  if (!activeId) {
    return (
      <div className="flex flex-col h-full">
        <ViewerToolbar availableCategories={availableCategories} />
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ViewerToolbar availableCategories={availableCategories} />
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          {viewMode === '2d' ? (
            <ImageViewer
              imageUrl={assets?.imageUrl ?? null}
              designId={activeId}
            />
          ) : (
            <ModelViewer
              modelUrl={modelUrl}
              designId={activeId}
              color={designColor}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  )
}
