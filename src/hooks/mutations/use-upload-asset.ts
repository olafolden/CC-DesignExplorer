import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadAsset } from '@/lib/api'
import { queryKeys } from '../queries/keys'

export function useUploadAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      datasetId,
      designKey,
      assetType,
    }: {
      file: File
      datasetId: string
      designKey: string
      assetType: 'image' | 'model'
    }) => uploadAsset(file, datasetId, designKey, assetType),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assetUrls(variables.datasetId),
      })
    },
  })
}
