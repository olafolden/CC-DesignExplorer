import { useAppStore } from '@/store'
import { Badge } from '@/components/ui/badge'

export function FilterSummary() {
  const brushRanges = useAppStore((s) => s.brushRanges)
  const filteredIds = useAppStore((s) => s.filteredIds)
  const rawData = useAppStore((s) => s.rawData)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)
  const clearFilters = useAppStore((s) => s.clearFilters)

  if (!isDataLoaded || brushRanges.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {filteredIds.size} / {rawData.length} designs
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
