import { useCallback, useRef, useState } from 'react'
import { FolderOpen, Check, AlertCircle, X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { collectAssetFiles } from '@/lib/file-ingestion'
import { uploadAsset } from '@/lib/api'
import { MAX_FILE_SIZE_BYTES } from '@/lib/file-validation'
import { Button } from '@/components/ui/button'

type DropState = 'idle' | 'hover' | 'uploading' | 'loaded' | 'error'

export function AssetDropZone() {
  const [state, setState] = useState<DropState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  const isAssetsLoaded = useAppStore((s) => s.isAssetsLoaded)
  const assetMap = useAppStore((s) => s.assetMap)
  const mergeAssetMap = useAppStore((s) => s.mergeAssetMap)
  const clearAssets = useAppStore((s) => s.clearAssets)
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)

  const assetCount = Object.keys(assetMap).length
  const imageCount = Object.values(assetMap).filter((a) => a.imageUrl).length
  const modelCount = Object.values(assetMap).filter((a) => a.modelUrl).length

  const uploadFiles = useCallback(
    async (files: { name: string; file: File; designKey: string; assetType: 'image' | 'model' }[]) => {
      if (!currentDatasetId) {
        setState('error')
        setError('No dataset loaded — upload data first')
        return
      }
      if (files.length === 0) {
        setState('error')
        setError('No image or model files found')
        return
      }

      // Client-side size check for fast UX feedback
      const oversized = files.filter((f) => f.file.size > MAX_FILE_SIZE_BYTES)
      if (oversized.length > 0) {
        const limitMB = MAX_FILE_SIZE_BYTES / (1024 * 1024)
        setState('error')
        setError(`${oversized.length} file(s) exceed ${limitMB} MB limit: ${oversized[0].name}`)
        return
      }

      setState('uploading')
      setProgress({ done: 0, total: files.length })

      let uploaded = 0
      const errors: string[] = []

      for (const { file, designKey, assetType } of files) {
        try {
          await uploadAsset(file, currentDatasetId, designKey, assetType)
          uploaded++
          setProgress({ done: uploaded, total: files.length })
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof Error ? e.message : 'failed'}`)
        }
      }

      if (errors.length > 0 && uploaded === 0) {
        setState('error')
        setError(`All uploads failed. ${errors[0]}`)
        return
      }

      // Fetch signed URLs for the uploaded assets
      const { fetchAssetUrls } = await import('@/lib/api')
      try {
        const urls = await fetchAssetUrls(currentDatasetId)
        mergeAssetMap(urls)
      } catch {
        // Assets uploaded but URL fetch failed — user can reload
      }

      setState('loaded')
      if (errors.length > 0) {
        setError(`${uploaded}/${files.length} uploaded (${errors.length} failed)`)
      }
    },
    [currentDatasetId, mergeAssetMap]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setError(null)

      try {
        const files = await collectAssetFiles(e.dataTransfer)
        await uploadFiles(files)
      } catch (err) {
        setState('error')
        setError(err instanceof Error ? err.message : 'Failed to process assets')
      }
    },
    [uploadFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'loaded' || s === 'uploading' ? s : 'hover'))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'loaded' || s === 'uploading' ? s : 'idle'))
  }, [])

  const handleClick = useCallback(() => {
    if (!isAssetsLoaded) inputRef.current?.click()
  }, [isAssetsLoaded])

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (!fileList || fileList.length === 0) return

      try {
        const files = collectAssetFilesFromList(fileList)
        await uploadFiles(files)
      } catch (err) {
        setState('error')
        setError(err instanceof Error ? err.message : 'Failed to process assets')
      }
      e.target.value = ''
    },
    [uploadFiles]
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      clearAssets()
      setState('idle')
      setError(null)
    },
    [clearAssets]
  )

  const displayState = isAssetsLoaded ? 'loaded' : state

  return (
    <div
      className={cn(
        'relative rounded-md border px-3 py-2.5 transition-colors cursor-pointer',
        displayState === 'idle' && 'border-dashed border-border hover:border-primary/40 hover:bg-accent/30',
        displayState === 'hover' && 'border-primary/60 bg-primary/5 border-solid',
        displayState === 'uploading' && 'border-dashed border-border animate-pulse',
        displayState === 'loaded' && 'border-solid border-green-500/40 bg-green-500/5 cursor-default',
        displayState === 'error' && 'border-solid border-destructive/40 bg-destructive/5'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      {/* Hidden file input with webkitdirectory fallback */}
      <input
        ref={inputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is not in the type defs
        webkitdirectory=""
        className="hidden"
        onChange={handleFileInput}
      />

      <div className="flex items-center gap-2">
        {displayState === 'loaded' ? (
          <Check className="h-4 w-4 shrink-0 text-green-500" />
        ) : displayState === 'error' ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
        ) : displayState === 'uploading' ? (
          <Upload className="h-4 w-4 shrink-0 text-muted-foreground animate-pulse" />
        ) : (
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <div className="min-w-0 flex-1">
          {displayState === 'loaded' ? (
            <div>
              <p className="text-xs text-foreground">{assetCount} designs</p>
              <p className="text-[10px] text-muted-foreground">
                {imageCount} images, {modelCount} models
              </p>
            </div>
          ) : displayState === 'uploading' ? (
            <p className="text-xs text-muted-foreground">
              Uploading {progress.done}/{progress.total}...
            </p>
          ) : displayState === 'error' && error ? (
            <p className="text-xs truncate text-destructive">{error}</p>
          ) : displayState === 'hover' ? (
            <p className="text-xs text-primary">Release to upload</p>
          ) : (
            <p className="text-xs text-muted-foreground">Drop asset folder or click</p>
          )}
        </div>

        {displayState === 'loaded' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Helper to extract asset file info from a FileList (file input)
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']
const MODEL_EXTENSIONS = ['.glb', '.gltf']

function collectAssetFilesFromList(
  fileList: FileList
): { name: string; file: File; designKey: string; assetType: 'image' | 'model' }[] {
  const result: { name: string; file: File; designKey: string; assetType: 'image' | 'model' }[] = []

  for (const file of Array.from(fileList)) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const designKey = file.name.replace(/\.[^.]+$/, '')

    if (IMAGE_EXTENSIONS.includes(ext)) {
      result.push({ name: file.name, file, designKey, assetType: 'image' })
    } else if (MODEL_EXTENSIONS.includes(ext)) {
      result.push({ name: file.name, file, designKey, assetType: 'model' })
    }
  }

  return result
}
