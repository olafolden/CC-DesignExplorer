import { useEffect, useRef } from 'react'
import { ImageOff, Box } from 'lucide-react'
import { useAppStore } from '@/store'
import { useAssetUrls } from '@/hooks/queries/use-asset-urls'
import { useColorScale } from '@/hooks/useColorScale'
import { useFilteredDesigns } from '@/hooks/useFilteredDesigns'
import { useRefreshAssets } from '@/hooks/useRefreshAssets'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function CatalogueView() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const selectedDesignId = useAppStore((s) => s.selectedDesignId)
  const setSelectedDesignId = useAppStore((s) => s.setSelectedDesignId)
  const setHoveredDesignId = useAppStore((s) => s.setHoveredDesignId)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const colorMetricKey = useAppStore((s) => s.colorMetricKey)
  const colorScale = useColorScale()

  const { assets: assetMap } = useAssetUrls(currentDatasetId)
  const filteredDesigns = useFilteredDesigns()

  const selectedRef = useRef<HTMLButtonElement>(null)
  const refreshAssets = useRefreshAssets()

  // Scroll selected thumbnail into view when selection changes externally
  useEffect(() => {
    if (selectedDesignId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedDesignId])

  if (filteredDesigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
        <ImageOff className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-xs">No designs match current filters</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 p-3">
        {filteredDesigns.map((design) => {
          const assets = assetMap[design.id]
          const imageUrl = assets?.imageUrl
          const isSelected = design.id === selectedDesignId

          let colorBar: string | undefined
          if (colorScale && colorMetricKey) {
            const val = design[colorMetricKey]
            if (typeof val === 'number') {
              colorBar = colorScale.getColorForValue(val)
            }
          }

          const hasModel = assets?.modelUrls && Object.keys(assets.modelUrls).length > 0

          return (
            <button
              key={design.id}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => {
                setSelectedDesignId(design.id)
              }}
              onMouseEnter={() => setHoveredDesignId(design.id)}
              onMouseLeave={() => setHoveredDesignId(null)}
              className={cn(
                'group relative flex flex-col rounded-md border bg-card overflow-hidden',
                'transition-all hover:ring-2 hover:ring-ring/50',
                isSelected && 'ring-2 ring-primary'
              )}
            >
              {/* 3D button */}
              {hasModel && (
                <div
                  className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDesignId(design.id)
                    setViewMode('3d')
                  }}
                >
                  <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 bg-background/80 border border-border text-[10px] font-medium text-foreground hover:bg-background shadow-sm cursor-pointer">
                    <Box className="h-3 w-3" />
                    3D
                  </div>
                </div>
              )}

              {/* Color bar */}
              {colorBar && (
                <div
                  className="h-1 w-full shrink-0"
                  style={{ backgroundColor: colorBar }}
                />
              )}

              {/* Thumbnail */}
              <div className="aspect-square w-full bg-muted/30 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={design.id}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={refreshAssets}
                  />
                ) : (
                  <ImageOff className="h-6 w-6 text-muted-foreground/20" />
                )}
              </div>

              {/* Label */}
              <div className="px-1.5 py-1 text-center">
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  {design.id}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
