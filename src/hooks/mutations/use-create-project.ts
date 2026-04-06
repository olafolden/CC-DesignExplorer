import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject } from '@/lib/api'
import { queryKeys } from '../queries/keys'

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}
