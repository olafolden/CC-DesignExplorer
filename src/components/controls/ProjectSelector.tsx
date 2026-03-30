import { useCallback, useState } from 'react'
import { Plus, Trash2, FolderKanban, FileX2 } from 'lucide-react'
import { useAppStore } from '@/store'
import {
  createProject,
  deleteProject,
  deleteDataset,
  fetchProjectDatasets,
  fetchDataset,
  fetchAssetUrls,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DesignIteration } from '@/types/design'

export function ProjectSelector() {
  const projects = useAppStore((s) => s.projects)
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setCurrentDatasetId = useAppStore((s) => s.setCurrentDatasetId)
  const setProjects = useAppStore((s) => s.setProjects)
  const setRawData = useAppStore((s) => s.setRawData)
  const clearData = useAppStore((s) => s.clearData)
  const mergeAssetMap = useAppStore((s) => s.mergeAssetMap)
  const clearAssets = useAppStore((s) => s.clearAssets)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const loadDataset = useCallback(
    async (datasetId: string) => {
      const datasetResponse = await fetchDataset(datasetId)
      const data = datasetResponse.data as DesignIteration[]
      setRawData(data, datasetResponse.columns)
      setCurrentDatasetId(datasetId)

      try {
        const assetUrls = await fetchAssetUrls(datasetId)
        if (Object.keys(assetUrls).length > 0) {
          mergeAssetMap(assetUrls)
        }
      } catch {
        // No assets yet
      }
    },
    [setRawData, setCurrentDatasetId, mergeAssetMap]
  )

  const switchProject = useCallback(
    async (projectId: string) => {
      if (projectId === currentProjectId) return
      setLoading(true)

      try {
        clearData()
        clearAssets()
        setCurrentProjectId(projectId)

        const datasets = await fetchProjectDatasets(projectId)
        if (datasets.length > 0) {
          await loadDataset(datasets[0].id)
        } else {
          setCurrentDatasetId(null)
        }
      } catch {
        // Failed to switch
      } finally {
        setLoading(false)
      }
    },
    [currentProjectId, clearData, clearAssets, setCurrentProjectId, setCurrentDatasetId, loadDataset]
  )

  const handleCreate = useCallback(async () => {
    const name = newName.trim()
    if (!name) return

    try {
      const project = await createProject(name)
      setProjects([project, ...projects])
      setNewName('')
      setIsCreating(false)
      await switchProject(project.id)
    } catch {
      // Failed to create
    }
  }, [newName, projects, setProjects, switchProject])

  const handleDeleteProject = useCallback(async () => {
    if (!currentProjectId) return
    if (!window.confirm('Delete this project and all its data?')) return

    try {
      await deleteProject(currentProjectId)
      const remaining = projects.filter((p) => p.id !== currentProjectId)
      setProjects(remaining)

      if (remaining.length > 0) {
        await switchProject(remaining[0].id)
      } else {
        clearData()
        clearAssets()
        setCurrentProjectId(null)
        setCurrentDatasetId(null)
      }
    } catch {
      // Failed to delete
    }
  }, [currentProjectId, projects, setProjects, switchProject, clearData, clearAssets, setCurrentProjectId, setCurrentDatasetId])

  const handleDeleteDataset = useCallback(async () => {
    if (!currentDatasetId || !currentProjectId) return
    if (!window.confirm('Delete this dataset and its assets?')) return

    try {
      await deleteDataset(currentDatasetId)
      clearData()
      clearAssets()

      // Try loading another dataset from the same project
      const datasets = await fetchProjectDatasets(currentProjectId)
      if (datasets.length > 0) {
        await loadDataset(datasets[0].id)
      } else {
        setCurrentDatasetId(null)
      }
    } catch {
      // Failed to delete
    }
  }, [currentDatasetId, currentProjectId, clearData, clearAssets, setCurrentDatasetId, loadDataset])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Select
          value={currentProjectId ?? ''}
          onValueChange={switchProject}
          disabled={loading}
        >
          <SelectTrigger className="h-7 text-xs flex-1">
            <SelectValue placeholder="No project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setIsCreating(!isCreating)}
          title="New project"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>

        {currentProjectId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleDeleteProject}
            title="Delete project"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="flex gap-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Project name"
            className="flex-1 h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs"
            onClick={handleCreate}
            disabled={!newName.trim()}
          >
            Create
          </Button>
        </div>
      )}

      {isDataLoaded && currentDatasetId && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-full justify-start gap-1.5 text-[10px] text-muted-foreground hover:text-destructive"
          onClick={handleDeleteDataset}
        >
          <FileX2 className="h-3 w-3" />
          Delete current dataset
        </Button>
      )}
    </div>
  )
}
