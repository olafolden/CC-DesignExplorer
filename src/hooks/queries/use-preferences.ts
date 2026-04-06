import { useQuery } from '@tanstack/react-query'
import { fetchPreferences } from '@/lib/api'
import { queryKeys } from './keys'

export function usePreferences() {
  return useQuery({
    queryKey: queryKeys.preferences,
    queryFn: fetchPreferences,
  })
}
