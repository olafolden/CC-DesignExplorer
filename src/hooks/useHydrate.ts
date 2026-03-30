import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { fetchProjects, fetchDataset, fetchAssetUrls } from '@/lib/api'
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

  useEffect(() => {
    if (hasHydrated.current || isDataLoaded) return
    hasHydrated.current = true

    async function hydrate() {
      setIsHydrating(true)
      try {
        // Fetch user's projects
        const projects = await fetchProjects()
        setProjects(projects)

        if (projects.length === 0) {
          setIsHydrating(false)
          return
        }

        // Use the most recently updated project
        const project = projects[0]
        setCurrentProjectId(project.id)

        // Fetch datasets for this project — we need to find the latest one
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

        // Reconstruct DesignIteration[] with proper typing
        const data = datasetResponse.data as DesignIteration[]
        setRawData(data, datasetResponse.columns)

        // Fetch asset URLs for this dataset
        try {
          const assetUrls = await fetchAssetUrls(latestDataset.id)
          if (Object.keys(assetUrls).length > 0) {
            mergeAssetMap(assetUrls)
          }
        } catch {
          // Assets may not exist yet — that's fine
        }
      } catch {
        // Silently fail — user just sees empty explorer
      } finally {
        setIsHydrating(false)
      }
    }

    hydrate()
  }, [isDataLoaded, setRawData, setCurrentProjectId, setCurrentDatasetId, setProjects, setIsHydrating, mergeAssetMap])
}
