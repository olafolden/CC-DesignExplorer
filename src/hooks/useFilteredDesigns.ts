import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'

export function useFilteredDesigns() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const brushRanges = useAppStore((s) => s.brushRanges)
  const { data: datasetResponse } = useDataset(currentDatasetId)
  const rawData = datasetResponse?.data ?? []

  return useMemo(() => {
    if (brushRanges.length === 0) return rawData

    return rawData.filter((row) =>
      brushRanges.every((br) => {
        const val = row[br.key]
        return typeof val === 'number' && val >= br.range[0] && val <= br.range[1]
      })
    )
  }, [rawData, brushRanges])
}

export function useFilteredIds() {
  const designs = useFilteredDesigns()
  return useMemo(() => new Set(designs.map((d) => d.id)), [designs])
}
