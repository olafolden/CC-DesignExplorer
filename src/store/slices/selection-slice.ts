import type { StateCreator } from 'zustand'
import type { AppStore, SelectionSlice } from '../types'

export const createSelectionSlice: StateCreator<AppStore, [], [], SelectionSlice> = (
  set
) => ({
  selectedDesignId: null,
  hoveredDesignId: null,
  setSelectedDesignId: (id) => set({ selectedDesignId: id }),
  setHoveredDesignId: (id) => set({ hoveredDesignId: id }),
})
