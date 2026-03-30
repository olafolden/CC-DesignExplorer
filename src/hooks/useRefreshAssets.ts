import { useCallback, useRef } from 'react'
import { useAppStore } from '@/store'
import { fetchAssetUrls } from '@/lib/api'

/**
 * Returns a callback that re-fetches signed asset URLs for the current dataset.
 * Debounced to avoid multiple simultaneous refreshes (e.g. if many images 403 at once).
 */
export function useRefreshAssets() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const mergeAssetMap = useAppStore((s) => s.mergeAssetMap)
  const refreshing = useRef(false)

  return useCallback(async () => {
    if (!currentDatasetId || refreshing.current) return
    refreshing.current = true

    try {
      const urls = await fetchAssetUrls(currentDatasetId)
      if (Object.keys(urls).length > 0) {
        mergeAssetMap(urls)
      }
    } catch {
      // Can't refresh — signed URLs may remain stale
    } finally {
      // Cooldown to avoid rapid re-fetches
      setTimeout(() => { refreshing.current = false }, 5000)
    }
  }, [currentDatasetId, mergeAssetMap])
}
