import type { StateCreator } from 'zustand'
import type { AppStore, DataSlice } from '../types'

export const createDataSlice: StateCreator<AppStore, [], [], DataSlice> = (set) => ({
  rawData: [],
  columns: [],
  isDataLoaded: false,
  setRawData: (data, columns) => set({ rawData: data, columns, isDataLoaded: true }),
  clearData: () => set({ rawData: [], columns: [], isDataLoaded: false }),
})
