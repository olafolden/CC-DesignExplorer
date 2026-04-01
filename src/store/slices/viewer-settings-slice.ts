import type { StateCreator } from 'zustand'
import type { AppStore, ViewerSettingsSlice, ViewerSettings } from '../types'

export const DEFAULT_VIEWER_SETTINGS: ViewerSettings = {
  backgroundColor: '#222222',
  gridVisible: true,
  gridSize: 4,
  ambientIntensity: 1.0,
  directionalIntensity: 0.8,
  exposure: 1.0,
  autoRotate: false,
  fov: 50,
  wireframe: false,
  opacity: 1.0,
  doubleSided: true,
}

export const createViewerSettingsSlice: StateCreator<AppStore, [], [], ViewerSettingsSlice> = (set) => ({
  viewerSettings: { ...DEFAULT_VIEWER_SETTINGS },
  setViewerSettings: (partial) =>
    set((s) => ({
      viewerSettings: { ...s.viewerSettings, ...partial },
    })),
  resetViewerSettings: () =>
    set({ viewerSettings: { ...DEFAULT_VIEWER_SETTINGS } }),
})
