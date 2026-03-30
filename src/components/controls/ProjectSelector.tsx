import { useCallback, useState } from 'react'
import { Plus, Trash2, FolderKanban } from 'lucide-react'
import { useAppStore } from '@/store'
import {
  createProject,
  deleteProject,
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
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setCurrentDatasetId = useAppStore((s) => s.setCurrentDatasetId)
  const setProjects = useAppStore((s) => s.setProjects)
  const setRawData = useAppStore((s) => s.setRawData)
  const clearData = useAppStore((s) => s.clearData)
  const mergeAssetMap = useAppStore((s) => s.mergeAssetMap)
  const clearAssets = useAppStore((s) => s.clearAssets)

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const switchProject = useCallback(
    async (projectId: string) => {
      if (projectId === currentProjectId) return
      setLoading(true)

      try {
        // Clear current state
        clearData()
        clearAssets()
        setCurrentProjectId(projectId)

        // Load datasets for the new project
        const datasets = await fetchProjectDatasets(projectId)
        if (datasets.length > 0) {
          const latest = datasets[0]
          setCurrentDatasetId(latest.id)

          const datasetResponse = await fetchDataset(latest.id)
          const data = datasetResponse.data as DesignIteration[]
          setRawData(data, datasetResponse.columns)

          // Load assets
          try {
            const assetUrls = await fetchAssetUrls(latest.id)
            if (Object.keys(assetUrls).length > 0) {
              mergeAssetMap(assetUrls)
            }
          } catch {
            // No assets yet
          }
        } else {
          setCurrentDatasetId(null)
        }
      } catch {
        // Failed to switch — keep current state
      } finally {
        setLoading(false)
      }
    },
    [currentProjectId, clearData, clearAssets, setCurrentProjectId, setCurrentDatasetId, setRawData, mergeAssetMap]
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

  const handleDelete = useCallback(async () => {
    if (!currentProjectId) return
    const confirmed = window.confirm('Delete this project and all its data?')
    if (!confirmed) return

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
            onClick={handleDelete}
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
    </div>
  )
}
