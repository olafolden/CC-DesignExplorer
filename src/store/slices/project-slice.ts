import type { StateCreator } from 'zustand'
import type { AppStore, ProjectSlice } from '../types'

export const createProjectSlice: StateCreator<AppStore, [], [], ProjectSlice> = (
  set
) => ({
  currentProjectId: null,
  currentDatasetId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setCurrentDatasetId: (id) => set({ currentDatasetId: id }),
  resetUIForNewDataset: () =>
    set({
      brushRanges: [],
      colorMetricKey: null,
      selectedDesignId: null,
      hoveredDesignId: null,
    }),
})
