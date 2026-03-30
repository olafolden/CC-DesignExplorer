import type { StateCreator } from 'zustand'
import type { AppStore, AssetSlice } from '../types'

export const createAssetSlice: StateCreator<AppStore, [], [], AssetSlice> = (
  set
) => ({
  assetMap: {},
  isAssetsLoaded: false,
  setAssetMap: (map) => set({ assetMap: map, isAssetsLoaded: true }),
  mergeAssetMap: (partial) =>
    set((state) => ({
      assetMap: { ...state.assetMap, ...partial },
      isAssetsLoaded: true,
    })),
  clearAssets: () => set({ assetMap: {}, isAssetsLoaded: false }),
})
