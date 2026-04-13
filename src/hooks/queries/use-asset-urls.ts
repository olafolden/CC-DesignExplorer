import { useQuery } from '@tanstack/react-query'
import { fetchAssetUrls } from '@/lib/api'
import { queryKeys } from './keys'
import type { AssetMap } from '@/types/assets'

const EMPTY_ASSETS: AssetMap = {}

export function useAssetUrls(datasetId: string | null) {
  const query = useQuery({
    queryKey: queryKeys.assetUrls(datasetId!),
    queryFn: () => fetchAssetUrls(datasetId!),
    enabled: !!datasetId,
    staleTime: 45 * 60 * 1000, // 45 minutes (signed URLs expire in 1h)
  })

  return {
    ...query,
    assets: query.data?.assets ?? EMPTY_ASSETS,
    contextModelUrl: query.data?.contextModelUrl ?? null,
    contextModelUrls: query.data?.contextModelUrls ?? null,
  }
}
