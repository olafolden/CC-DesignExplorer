import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'

export function useFilteredDesigns() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const filteredIds = useAppStore((s) => s.filteredIds)
  const { data: datasetResponse } = useDataset(currentDatasetId)
  const rawData = datasetResponse?.data ?? []

  return useMemo(
    () => rawData.filter((d) => filteredIds.has(d.id)),
    [rawData, filteredIds]
  )
}
