import type { StateCreator } from 'zustand'
import type { AppStore, ViewSlice } from '../types'

export const createViewSlice: StateCreator<AppStore, [], [], ViewSlice> = (set) => ({
  viewMode: '2d',
  colorMetricKey: null,
  setViewMode: (mode) => set({ viewMode: mode }),
  setColorMetricKey: (key) => set({ colorMetricKey: key }),
})
