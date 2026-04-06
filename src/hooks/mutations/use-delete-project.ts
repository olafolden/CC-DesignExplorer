import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProject } from '@/lib/api'
import { queryKeys } from '../queries/keys'

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}
