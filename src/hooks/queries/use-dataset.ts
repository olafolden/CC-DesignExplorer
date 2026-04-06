import { useQuery } from '@tanstack/react-query'
import { fetchDataset } from '@/lib/api'
import { queryKeys } from './keys'

export function useDataset(datasetId: string | null) {
  return useQuery({
    queryKey: queryKeys.dataset(datasetId!),
    queryFn: () => fetchDataset(datasetId!),
    enabled: !!datasetId,
  })
}
