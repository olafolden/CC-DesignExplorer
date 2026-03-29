import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { createColorScale, getColorHex } from '@/lib/colors'

export function useColorScale() {
  const colorMetricKey = useAppStore((s) => s.colorMetricKey)
  const columns = useAppStore((s) => s.columns)

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
