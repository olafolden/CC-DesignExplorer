import type { StateCreator } from 'zustand'
import type { AppStore, FilterSlice } from '../types'

export const createFilterSlice: StateCreator<AppStore, [], [], FilterSlice> = (
  set,
  get
) => ({
  brushRanges: [],
  filteredIds: new Set<string>(),
  setBrushRanges: (ranges) => {
    set({ brushRanges: ranges })
    get().recomputeFilteredIds()
  },
  recomputeFilteredIds: () => {
    const { rawData, brushRanges } = get()
    if (brushRanges.length === 0) {
      set({ filteredIds: new Set(rawData.map((d) => d.id)) })
      return
    }
    const filtered = rawData.filter((row) =>
      brushRanges.every((br) => {
        const val = row[br.key]
        return typeof val === 'number' && val >= br.range[0] && val <= br.range[1]
      })
    )
    set({ filteredIds: new Set(filtered.map((d) => d.id)) })
  },
  clearFilters: () => {
    const { rawData } = get()
    set({
      brushRanges: [],
      filteredIds: new Set(rawData.map((d) => d.id)),
    })
  },
})
