import { useQuery } from '@tanstack/react-query'
import { fetchAssetUrls } from '@/lib/api'
import { queryKeys } from './keys'

export function useAssetUrls(datasetId: string | null) {
  return useQuery({
    queryKey: queryKeys.assetUrls(datasetId!),
    queryFn: () => fetchAssetUrls(datasetId!),
    enabled: !!datasetId,
    staleTime: 45 * 60 * 1000, // 45 minutes (signed URLs expire in 1h)
  })
}
