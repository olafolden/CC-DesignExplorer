import { useQuery } from '@tanstack/react-query'
import { fetchProjects } from '@/lib/api'
import { queryKeys } from './keys'

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
  })
}
