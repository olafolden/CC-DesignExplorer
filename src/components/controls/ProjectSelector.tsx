import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, FolderKanban, FileX2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { useProjects } from '@/hooks/queries/use-projects'
import { useProjectDatasets } from '@/hooks/queries/use-project-datasets'
import { useDataset } from '@/hooks/queries/use-dataset'
import { useCreateProject } from '@/hooks/mutations/use-create-project'
import { useDeleteProject } from '@/hooks/mutations/use-delete-project'
import { useDeleteDataset } from '@/hooks/mutations/use-delete-dataset'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ProjectSelector() {
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setCurrentDatasetId = useAppStore((s) => s.setCurrentDatasetId)
  const clearData = useAppStore((s) => s.clearData)
  const clearAssets = useAppStore((s) => s.clearAssets)

  const { data: projects = [] } = useProjects()
  const { data: datasets = [] } = useProjectDatasets(currentProjectId)
  const { isSuccess: isDataLoaded } = useDataset(currentDatasetId)

  const createProjectMutation = useCreateProject()
  const deleteProjectMutation = useDeleteProject()
  const deleteDatasetMutation = useDeleteDataset()

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const switchProject = useCallback(
    async (projectId: string) => {
      if (projectId === currentProjectId) return
      setLoading(true)

      try {
        clearData()
        clearAssets()
        setCurrentProjectId(projectId)
        // Dataset loading happens automatically via useProjectDatasets + useDataset
        // We need to set the first dataset as current
        // Since we just switched project, datasets query will refetch.
        // For now, clear the dataset id — the effect below or user action will set it.
        setCurrentDatasetId(null)
      } finally {
        setLoading(false)
      }
    },
    [currentProjectId, clearData, clearAssets, setCurrentProjectId, setCurrentDatasetId]
  )

  // Auto-select first dataset when project datasets load and no dataset is selected
  useEffect(() => {
    if (currentProjectId && !currentDatasetId && datasets.length > 0) {
      setCurrentDatasetId(datasets[0].id)
    }
  }, [currentProjectId, currentDatasetId, datasets, setCurrentDatasetId])

  const handleCreate = useCallback(async () => {
    const name = newName.trim()
    if (!name) return

    try {
      const project = await createProjectMutation.mutateAsync(name)
      setNewName('')
      setIsCreating(false)
      await switchProject(project.id)
    } catch {
      // Failed to create
    }
  }, [newName, createProjectMutation, switchProject])

  const handleDeleteProject = useCallback(async () => {
    if (!currentProjectId) return
    if (!window.confirm('Delete this project and all its data?')) return

    try {
      await deleteProjectMutation.mutateAsync(currentProjectId)

      const remaining = projects.filter((p) => p.id !== currentProjectId)
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
  }, [currentProjectId, projects, deleteProjectMutation, switchProject, clearData, clearAssets, setCurrentProjectId, setCurrentDatasetId])

  const handleDeleteDataset = useCallback(async () => {
    if (!currentDatasetId || !currentProjectId) return
    if (!window.confirm('Delete this dataset and its assets?')) return

    try {
      await deleteDatasetMutation.mutateAsync(currentDatasetId)
      clearData()
      clearAssets()

      // The mutation invalidates queries, so datasets will refetch.
      // Clear current dataset; auto-select will pick the next one if available.
      setCurrentDatasetId(null)
    } catch {
      // Failed to delete
    }
  }, [currentDatasetId, currentProjectId, deleteDatasetMutation, clearData, clearAssets, setCurrentDatasetId])

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
