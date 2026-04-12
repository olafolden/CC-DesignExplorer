import type { StateCreator } from 'zustand'
import type { AppStore, ViewerSettingsSlice, ViewerSettings, ViewerProfile } from '../types'

const STORAGE_KEY = 'design-explorer:viewer-profiles'

export const DEFAULT_VIEWER_SETTINGS: ViewerSettings = {
  backgroundColor: '#222222',
  gridVisible: false,
  gridSize: 4,
  ambientIntensity: 1.0,
  directionalIntensity: 2.0,
  exposure: 3.0,
  autoRotate: false,
  fov: 50,
  wireframe: false,
  opacity: 1.0,
  doubleSided: true,
}

function loadProfilesFromStorage(): ViewerProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function persistProfiles(profiles: ViewerProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export const createViewerSettingsSlice: StateCreator<AppStore, [], [], ViewerSettingsSlice> = (set, get) => ({
  viewerSettings: { ...DEFAULT_VIEWER_SETTINGS },
  viewerProfiles: loadProfilesFromStorage(),

  setViewerSettings: (partial) =>
    set((s) => ({
      viewerSettings: { ...s.viewerSettings, ...partial },
    })),

  resetViewerSettings: () =>
    set({ viewerSettings: { ...DEFAULT_VIEWER_SETTINGS } }),

  saveProfile: (name) => {
    const profile: ViewerProfile = {
      id: crypto.randomUUID(),
      name,
      settings: { ...get().viewerSettings },
    }
    const updated = [...get().viewerProfiles, profile]
    set({ viewerProfiles: updated })
    persistProfiles(updated)
  },

  loadProfile: (id) => {
    const profile = get().viewerProfiles.find((p) => p.id === id)
    if (profile) {
      set({ viewerSettings: { ...profile.settings } })
    }
  },

  deleteProfile: (id) => {
    const updated = get().viewerProfiles.filter((p) => p.id !== id)
    set({ viewerProfiles: updated })
    persistProfiles(updated)
  },
})
