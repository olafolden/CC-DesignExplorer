import type { StateCreator } from 'zustand'
import type { AppStore, DataSlice } from '../types'

export const createDataSlice: StateCreator<AppStore, [], [], DataSlice> = (
  set,
  get
) => ({
  rawData: [],
  columns: [],
  isDataLoaded: false,
  setRawData: (data, columns) => {
    const allIds = new Set(data.map((d) => d.id))
    const firstNumericCol = columns.find((c) => c.type === 'number')
    set({
      rawData: data,
      columns,
      isDataLoaded: true,
      filteredIds: allIds,
      brushRanges: [],
      colorMetricKey: firstNumericCol?.key ?? null,
      selectedDesignId: null,
      hoveredDesignId: null,
    })
  },
  clearData: () => {
    get().clearAssets()
    set({
      rawData: [],
      columns: [],
      isDataLoaded: false,
      filteredIds: new Set<string>(),
      brushRanges: [],
      colorMetricKey: null,
      selectedDesignId: null,
      hoveredDesignId: null,
      assetMap: {},
      isAssetsLoaded: false,
    })
  },
})
