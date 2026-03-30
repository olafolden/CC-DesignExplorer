import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { fetchProjects, fetchDataset, fetchAssetUrls, fetchPreferences } from '@/lib/api'
import type { DesignIteration } from '@/types/design'

export function useHydrate() {
  const hasHydrated = useRef(false)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)
  const setRawData = useAppStore((s) => s.setRawData)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setCurrentDatasetId = useAppStore((s) => s.setCurrentDatasetId)
  const setProjects = useAppStore((s) => s.setProjects)
  const setIsHydrating = useAppStore((s) => s.setIsHydrating)
  const mergeAssetMap = useAppStore((s) => s.mergeAssetMap)
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    if (hasHydrated.current || isDataLoaded) return
    hasHydrated.current = true

    async function hydrate() {
      setIsHydrating(true)
      try {
        // Load preferences and projects in parallel
        const [prefs, projects] = await Promise.all([
          fetchPreferences().catch(() => null),
          fetchProjects(),
        ])

        // Apply saved theme
        if (prefs?.theme) {
          setTheme(prefs.theme)
        }

        setProjects(projects)

        if (projects.length === 0) {
          setIsHydrating(false)
          return
        }

        // Use default project from preferences, or most recently updated
        const defaultProjectId = prefs?.default_project_id
        const project = projects.find((p) => p.id === defaultProjectId) || projects[0]
        setCurrentProjectId(project.id)

        // Fetch datasets for this project
        const res = await fetch(`/api/projects/${project.id}/datasets`)
        if (!res.ok) {
          setIsHydrating(false)
          return
        }
        const datasets = await res.json()

        if (!datasets || datasets.length === 0) {
          setIsHydrating(false)
          return
        }

        // Load the most recent dataset
        const latestDataset = datasets[0]
        setCurrentDatasetId(latestDataset.id)

        // Fetch full dataset with design data
        const datasetResponse = await fetchDataset(latestDataset.id)
        const data = datasetResponse.data as DesignIteration[]
        setRawData(data, datasetResponse.columns)

        // Fetch asset URLs for this dataset
        try {
          const assetUrls = await fetchAssetUrls(latestDataset.id)
          if (Object.keys(assetUrls).length > 0) {
            mergeAssetMap(assetUrls)
          }
        } catch {
          // Assets may not exist yet
        }
      } catch {
        // Silently fail — user just sees empty explorer
      } finally {
        setIsHydrating(false)
      }
    }

    hydrate()
  }, [isDataLoaded, setRawData, setCurrentProjectId, setCurrentDatasetId, setProjects, setIsHydrating, mergeAssetMap, setTheme])
}
