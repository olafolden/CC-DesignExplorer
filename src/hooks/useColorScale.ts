import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'
import { createColorScale, getColorHex } from '@/lib/colors'

export function useColorScale() {
  const colorMetricKey = useAppStore((s) => s.colorMetricKey)
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const { data: datasetResponse } = useDataset(currentDatasetId)
  const columns = datasetResponse?.columns ?? []

  return useMemo(() => {
    if (!colorMetricKey) return null

    const col = columns.find((c) => c.key === colorMetricKey)
    if (!col || col.type !== 'number' || col.min == null || col.max == null) return null

    return {
      getColor: createColorScale(col.min, col.max),
      getColorForValue: (value: number) => getColorHex(value, col.min!, col.max!),
      min: col.min,
      max: col.max,
      key: colorMetricKey,
    }
  }, [colorMetricKey, columns])
}
