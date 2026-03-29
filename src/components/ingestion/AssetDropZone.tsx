import { useCallback, useRef, useState } from 'react'
import { FolderOpen, Check, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { processAssetDrop, processFileInput } from '@/lib/file-ingestion'
import { Button } from '@/components/ui/button'

type DropState = 'idle' | 'hover' | 'loading' | 'loaded' | 'error'

export function AssetDropZone() {
  const [state, setState] = useState<DropState>('idle')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAssetsLoaded = useAppStore((s) => s.isAssetsLoaded)
  const assetMap = useAppStore((s) => s.assetMap)
  const setAssetMap = useAppStore((s) => s.setAssetMap)
  const revokeAllUrls = useAppStore((s) => s.revokeAllUrls)

  const assetCount = Object.keys(assetMap).length
  const imageCount = Object.values(assetMap).filter((a) => a.imageUrl).length
  const modelCount = Object.values(assetMap).filter((a) => a.modelUrl).length

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setState('loading')
      setError(null)

      try {
        const map = await processAssetDrop(e.dataTransfer)
        const count = Object.keys(map).length
        if (count === 0) {
          setState('error')
          setError('No image or model files found')
          return
        }
        setAssetMap(map)
        setState('loaded')
      } catch (e) {
        setState('error')
        setError(e instanceof Error ? e.message : 'Failed to process assets')
      }
    },
    [setAssetMap]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'loaded' || s === 'loading' ? s : 'hover'))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'loaded' || s === 'loading' ? s : 'idle'))
  }, [])

  const handleClick = useCallback(() => {
    if (!isAssetsLoaded) inputRef.current?.click()
  }, [isAssetsLoaded])

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setState('loading')
      try {
        const map = await processFileInput(files)
        const count = Object.keys(map).length
        if (count === 0) {
          setState('error')
          setError('No image or model files found')
          return
        }
        setAssetMap(map)
        setState('loaded')
      } catch (err) {
        setState('error')
        setError(err instanceof Error ? err.message : 'Failed to process assets')
      }
      e.target.value = ''
    },
    [setAssetMap]
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      revokeAllUrls()
      setState('idle')
      setError(null)
    },
    [revokeAllUrls]
  )

  const displayState = isAssetsLoaded ? 'loaded' : state

  return (
    <div
      className={cn(
        'relative rounded-md border px-3 py-2.5 transition-colors cursor-pointer',
        displayState === 'idle' && 'border-dashed border-border hover:border-primary/40 hover:bg-accent/30',
        displayState === 'hover' && 'border-primary/60 bg-primary/5 border-solid',
        displayState === 'loading' && 'border-dashed border-border animate-pulse',
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
          ) : displayState === 'loading' ? (
            <p className="text-xs text-muted-foreground">Processing...</p>
          ) : displayState === 'error' && error ? (
            <p className="text-xs truncate text-destructive">{error}</p>
          ) : displayState === 'hover' ? (
            <p className="text-xs text-primary">Release to load</p>
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
