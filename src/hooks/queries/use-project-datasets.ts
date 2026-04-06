import { useQuery } from '@tanstack/react-query'
import { fetchProjectDatasets } from '@/lib/api'
import { queryKeys } from './keys'

export function useProjectDatasets(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.projectDatasets(projectId!),
    queryFn: () => fetchProjectDatasets(projectId!),
    enabled: !!projectId,
  })
}
