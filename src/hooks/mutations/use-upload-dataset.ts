import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadDataset } from '@/lib/api'
import { queryKeys } from '../queries/keys'

export function useUploadDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      jsonString,
      fileName,
    }: {
      projectId: string
      jsonString: string
      fileName: string
    }) => uploadDataset(projectId, jsonString, fileName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectDatasets(variables.projectId),
      })
    },
  })
}
