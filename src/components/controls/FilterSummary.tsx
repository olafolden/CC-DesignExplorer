import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'
import { useFilteredDesigns } from '@/hooks/useFilteredDesigns'
import { Badge } from '@/components/ui/badge'

export function FilterSummary() {
  const brushRanges = useAppStore((s) => s.brushRanges)
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const clearFilters = useAppStore((s) => s.clearFilters)

  const { data: datasetResponse, isSuccess: isDataLoaded } = useDataset(currentDatasetId)
  const rawData = datasetResponse?.data ?? []
  const filteredDesigns = useFilteredDesigns()

  if (!isDataLoaded || brushRanges.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {filteredDesigns.length} / {rawData.length} designs
        </p>
        <button
          onClick={clearFilters}
          className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {brushRanges.map((range) => (
          <Badge
            key={range.key}
            variant="secondary"
            className="text-[10px] gap-1 px-1.5 py-0"
          >
            {range.key}: {range.range[0].toFixed(1)}–{range.range[1].toFixed(1)}
          </Badge>
        ))}
      </div>
    </div>
  )
}
