import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteDataset } from '@/lib/api'
import { queryKeys } from '../queries/keys'

export function useDeleteDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDataset(id),
    onSuccess: (_data, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.dataset(deletedId) })
      queryClient.removeQueries({ queryKey: queryKeys.assetUrls(deletedId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}
