import type { StateCreator } from 'zustand'
import type { AppStore, AssetSlice } from '../types'

export const createAssetSlice: StateCreator<AppStore, [], [], AssetSlice> = (
  set,
  get
) => ({
  assetMap: {},
  isAssetsLoaded: false,
  setAssetMap: (map) => set({ assetMap: map, isAssetsLoaded: true }),
  revokeAllUrls: () => {
    const { assetMap } = get()
    for (const entry of Object.values(assetMap)) {
      if (entry.imageUrl) URL.revokeObjectURL(entry.imageUrl)
      if (entry.modelUrl) URL.revokeObjectURL(entry.modelUrl)
    }
    set({ assetMap: {}, isAssetsLoaded: false })
  },
})
