import type { StateCreator } from 'zustand'
import type { AppStore, FilterSlice } from '../types'

export const createFilterSlice: StateCreator<AppStore, [], [], FilterSlice> = (
  set
) => ({
  brushRanges: [],
  setBrushRanges: (ranges) => set({ brushRanges: ranges }),
  clearFilters: () => set({ brushRanges: [] }),
})
