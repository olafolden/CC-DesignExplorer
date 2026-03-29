import { useCallback, useRef, useState } from 'react'
import { Upload, Check, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { parseDesignData } from '@/lib/file-ingestion'
import { Button } from '@/components/ui/button'

type DropState = 'idle' | 'hover' | 'loaded' | 'error'

export function DropZone() {
  const [state, setState] = useState<DropState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDataLoaded = useAppStore((s) => s.isDataLoaded)
  const setRawData = useAppStore((s) => s.setRawData)
  const clearData = useAppStore((s) => s.clearData)

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.json')) {
        setState('error')
        setError('File must be .json')
        return
      }

      try {
        const text = await file.text()
        const { data, columns } = parseDesignData(text)
        setRawData(data, columns)
        setFileName(file.name)
        setState('loaded')
        setError(null)
      } catch (e) {
        setState('error')
        setError(e instanceof Error ? e.message : 'Failed to parse JSON')
      }
    },
    [setRawData]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'loaded' ? s : 'hover'))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'loaded' ? s : 'idle'))
  }, [])

  const handleClick = useCallback(() => {
    if (!isDataLoaded) inputRef.current?.click()
  }, [isDataLoaded])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ''
    },
    [processFile]
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      clearData()
      setState('idle')
      setFileName(null)
      setError(null)
    },
    [clearData]
  )

  const displayState = isDataLoaded ? 'loaded' : state

  return (
    <div
      className={cn(
        'relative rounded-md border px-3 py-2.5 transition-colors cursor-pointer',
        displayState === 'idle' && 'border-dashed border-border hover:border-primary/40 hover:bg-accent/30',
        displayState === 'hover' && 'border-primary/60 bg-primary/5 border-solid',
        displayState === 'loaded' && 'border-solid border-green-500/40 bg-green-500/5 cursor-default',
        displayState === 'error' && 'border-solid border-destructive/40 bg-destructive/5'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileInput}
      />

      <div className="flex items-center gap-2">
        {displayState === 'loaded' ? (
          <Check className="h-4 w-4 shrink-0 text-green-500" />
        ) : displayState === 'error' ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
        ) : (
          <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <div className="min-w-0 flex-1">
          {displayState === 'loaded' && fileName ? (
            <p className="text-xs truncate text-foreground">{fileName}</p>
          ) : displayState === 'error' && error ? (
            <p className="text-xs truncate text-destructive">{error}</p>
          ) : displayState === 'hover' ? (
            <p className="text-xs text-primary">Release to load</p>
          ) : (
            <p className="text-xs text-muted-foreground">Drop data.json or click</p>
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
