import { useCallback, useRef, useState } from 'react'
import { Upload, Check, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { parseDesignData } from '@/lib/file-ingestion'
import { uploadDataset, createProject, fetchProjects } from '@/lib/api'
import { Button } from '@/components/ui/button'

type DropState = 'idle' | 'hover' | 'loaded' | 'uploading' | 'error'

export function DropZone() {
  const [state, setState] = useState<DropState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDataLoaded = useAppStore((s) => s.isDataLoaded)
  const setRawData = useAppStore((s) => s.setRawData)
  const clearData = useAppStore((s) => s.clearData)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setCurrentDatasetId = useAppStore((s) => s.setCurrentDatasetId)
  const currentProjectId = useAppStore((s) => s.currentProjectId)

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.json')) {
        setState('error')
        setError('File must be .json')
        return
      }

      try {
        const text = await file.text()

        // Validate locally first (fast feedback)
        const { data, columns } = parseDesignData(text)

        setState('uploading')

        // Ensure we have a project
        let projectId = currentProjectId
        if (!projectId) {
          // Auto-create a default project or use existing
          const projects = await fetchProjects()
          if (projects.length > 0) {
            projectId = projects[0].id
          } else {
            const project = await createProject('My Project')
            projectId = project.id
          }
          setCurrentProjectId(projectId)
        }

        // Upload to server
        const result = await uploadDataset(projectId, text, file.name)
        setCurrentDatasetId(result.id)

        // Set local state from the parsed data (already validated)
        setRawData(data, columns)
        setFileName(file.name)
        setState('loaded')
        setError(null)
      } catch (e) {
        setState('error')
        setError(e instanceof Error ? e.message : 'Failed to upload data')
      }
    },
    [setRawData, currentProjectId, setCurrentProjectId, setCurrentDatasetId]
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
        displayState === 'uploading' && 'border-solid border-primary/40 bg-primary/5 cursor-wait',
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
        ) : displayState === 'uploading' ? (
          <Upload className="h-4 w-4 shrink-0 text-primary animate-pulse" />
        ) : (
          <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <div className="min-w-0 flex-1">
          {displayState === 'loaded' && fileName ? (
            <p className="text-xs truncate text-foreground">{fileName}</p>
          ) : displayState === 'error' && error ? (
            <p className="text-xs truncate text-destructive">{error}</p>
          ) : displayState === 'uploading' ? (
            <p className="text-xs text-primary">Uploading to server...</p>
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
