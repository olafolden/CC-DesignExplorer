import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store'
import { queryKeys } from '@/hooks/queries/keys'

/**
 * Returns a callback that invalidates the asset URL query for the current dataset.
 * Debounced to avoid multiple simultaneous refreshes (e.g. if many images 403 at once).
 */
export function useRefreshAssets() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const queryClient = useQueryClient()
  const refreshing = useRef(false)

  return useCallback(() => {
    if (!currentDatasetId || refreshing.current) return
    refreshing.current = true

    queryClient.invalidateQueries({
      queryKey: queryKeys.assetUrls(currentDatasetId),
    })

    // Cooldown to avoid rapid re-fetches
    setTimeout(() => { refreshing.current = false }, 5000)
  }, [currentDatasetId, queryClient])
}
