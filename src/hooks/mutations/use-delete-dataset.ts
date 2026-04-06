import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteDataset } from '@/lib/api'
import { queryKeys } from '../queries/keys'

export function useDeleteDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDataset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}
