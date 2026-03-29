import { useMemo } from 'react'
import { useAppStore } from '@/store'

export function useFilteredDesigns() {
  const rawData = useAppStore((s) => s.rawData)
  const filteredIds = useAppStore((s) => s.filteredIds)

  return useMemo(
    () => rawData.filter((d) => filteredIds.has(d.id)),
    [rawData, filteredIds]
  )
}
