import type { StateCreator } from 'zustand'
import type { AppStore, ProjectSlice } from '../types'

export const createProjectSlice: StateCreator<AppStore, [], [], ProjectSlice> = (
  set
) => ({
  currentProjectId: null,
  currentDatasetId: null,
  projects: [],
  isHydrating: false,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setCurrentDatasetId: (id) => set({ currentDatasetId: id }),
  setProjects: (projects) => set({ projects }),
  setIsHydrating: (v) => set({ isHydrating: v }),
})
