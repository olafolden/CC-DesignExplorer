import { useState, useCallback } from 'react'
import { ImageOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRefreshAssets } from '@/hooks/useRefreshAssets'

interface ImageViewerProps {
  imageUrl: string | null
  designId: string
}

export function ImageViewer({ imageUrl, designId }: ImageViewerProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const refreshAssets = useRefreshAssets()

  const handleError = useCallback(() => {
    setError(true)
    setLoaded(false)
    // Signed URL may have expired — try refreshing
    refreshAssets()
  }, [refreshAssets])

  if (!imageUrl || error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
        <ImageOff className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-xs">No image available for {designId}</p>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center h-full p-4">
      {!loaded && (
        <Skeleton className="absolute inset-4 rounded-md" />
      )}
      <img
        key={imageUrl}
        src={imageUrl}
        alt={`Design ${designId}`}
        className="max-h-full max-w-full object-contain transition-opacity duration-200"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => { setLoaded(true); setError(false) }}
        onError={handleError}
      />
    </div>
  )
}
