import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from '../index'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-123' })

const STORAGE_KEY = 'design-explorer:viewer-profiles'

describe('ViewerSettingsSlice', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    useAppStore.getState().resetViewerSettings()
    useAppStore.setState({ viewerProfiles: [] })
  })

  describe('defaults', () => {
    it('has directionalIntensity of 2.0', () => {
      expect(useAppStore.getState().viewerSettings.directionalIntensity).toBe(2.0)
    })

    it('has exposure of 3.0', () => {
      expect(useAppStore.getState().viewerSettings.exposure).toBe(3.0)
    })

    it('has gridVisible as false', () => {
      expect(useAppStore.getState().viewerSettings.gridVisible).toBe(false)
    })

    it('resetViewerSettings restores new defaults', () => {
      useAppStore.getState().setViewerSettings({ directionalIntensity: 0.5, exposure: 1.0, gridVisible: true })
      useAppStore.getState().resetViewerSettings()

      const s = useAppStore.getState().viewerSettings
      expect(s.directionalIntensity).toBe(2.0)
      expect(s.exposure).toBe(3.0)
      expect(s.gridVisible).toBe(false)
    })
  })

  describe('environment defaults', () => {
    it('has environmentPreset of "none"', () => {
      expect(useAppStore.getState().viewerSettings.environmentPreset).toBe('none')
    })

    it('has environmentIntensity of 1.0', () => {
      expect(useAppStore.getState().viewerSettings.environmentIntensity).toBe(1.0)
    })

    it('setViewerSettings updates environmentPreset', () => {
      useAppStore.getState().setViewerSettings({ environmentPreset: 'studio' })
      expect(useAppStore.getState().viewerSettings.environmentPreset).toBe('studio')
    })

    it('setViewerSettings updates environmentIntensity', () => {
      useAppStore.getState().setViewerSettings({ environmentIntensity: 2.5 })
      expect(useAppStore.getState().viewerSettings.environmentIntensity).toBe(2.5)
    })

    it('resetViewerSettings restores environment defaults', () => {
      useAppStore.getState().setViewerSettings({ environmentPreset: 'urban', environmentIntensity: 2.0 })
      useAppStore.getState().resetViewerSettings()
      expect(useAppStore.getState().viewerSettings.environmentPreset).toBe('none')
      expect(useAppStore.getState().viewerSettings.environmentIntensity).toBe(1.0)
    })
  })

  describe('profiles', () => {
    it('initializes with empty viewerProfiles', () => {
      expect(useAppStore.getState().viewerProfiles).toEqual([])
    })

    it('saveProfile creates a named profile from current settings', () => {
      useAppStore.getState().setViewerSettings({ exposure: 1.5 })
      useAppStore.getState().saveProfile('My Setup')

      const profiles = useAppStore.getState().viewerProfiles
      expect(profiles).toHaveLength(1)
      expect(profiles[0].name).toBe('My Setup')
      expect(profiles[0].id).toBe('test-uuid-123')
      expect(profiles[0].settings.exposure).toBe(1.5)
    })

    it('saveProfile persists to localStorage', () => {
      useAppStore.getState().saveProfile('Test')

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      )

      const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(stored).toHaveLength(1)
      expect(stored[0].name).toBe('Test')
    })

    it('loadProfile applies saved settings', () => {
      useAppStore.getState().setViewerSettings({ exposure: 1.5, gridVisible: true })
      useAppStore.getState().saveProfile('Custom')

      // Change settings away from the profile
      useAppStore.getState().setViewerSettings({ exposure: 0.5, gridVisible: false })

      const profileId = useAppStore.getState().viewerProfiles[0].id
      useAppStore.getState().loadProfile(profileId)

      expect(useAppStore.getState().viewerSettings.exposure).toBe(1.5)
      expect(useAppStore.getState().viewerSettings.gridVisible).toBe(true)
    })

    it('loadProfile does nothing for unknown id', () => {
      useAppStore.getState().setViewerSettings({ exposure: 2.5 })
      useAppStore.getState().loadProfile('nonexistent')

      expect(useAppStore.getState().viewerSettings.exposure).toBe(2.5)
    })

    it('deleteProfile removes the profile', () => {
      useAppStore.getState().saveProfile('ToDelete')

      const profileId = useAppStore.getState().viewerProfiles[0].id
      useAppStore.getState().deleteProfile(profileId)

      expect(useAppStore.getState().viewerProfiles).toEqual([])
    })

    it('deleteProfile persists removal to localStorage', () => {
      useAppStore.getState().saveProfile('ToDelete')
      vi.clearAllMocks()

      const profileId = useAppStore.getState().viewerProfiles[0].id
      useAppStore.getState().deleteProfile(profileId)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        '[]'
      )
    })

    it('profiles save and restore environment settings', () => {
      useAppStore.getState().setViewerSettings({ environmentPreset: 'overcast', environmentIntensity: 2.0 })
      useAppStore.getState().saveProfile('Env Profile')

      useAppStore.getState().setViewerSettings({ environmentPreset: 'none', environmentIntensity: 1.0 })

      const profileId = useAppStore.getState().viewerProfiles[0].id
      useAppStore.getState().loadProfile(profileId)

      expect(useAppStore.getState().viewerSettings.environmentPreset).toBe('overcast')
      expect(useAppStore.getState().viewerSettings.environmentIntensity).toBe(2.0)
    })

    it('loadProfile fills missing fields with defaults (backward compat)', () => {
      // Simulate an old profile that doesn't have environmentPreset
      const oldProfile = {
        id: 'old-profile',
        name: 'Old Profile',
        settings: {
          backgroundColor: '#000000',
          gridVisible: true,
          gridSize: 4,
          ambientIntensity: 0.5,
          directionalIntensity: 1.0,
          exposure: 2.0,
          autoRotate: true,
          fov: 60,
          wireframe: false,
          opacity: 0.8,
          doubleSided: true,
          // Note: no environmentPreset or environmentIntensity
        },
      }
      useAppStore.setState({ viewerProfiles: [oldProfile as never] })

      useAppStore.getState().loadProfile('old-profile')

      const s = useAppStore.getState().viewerSettings
      // Old settings should be applied
      expect(s.backgroundColor).toBe('#000000')
      expect(s.fov).toBe(60)
      // Missing fields should get defaults
      expect(s.environmentPreset).toBe('none')
      expect(s.environmentIntensity).toBe(1.0)
    })

    it('multiple profiles are preserved independently', () => {
      // Need unique IDs for each profile
      let callCount = 0
      vi.stubGlobal('crypto', { randomUUID: () => `uuid-${++callCount}` })

      useAppStore.getState().setViewerSettings({ exposure: 1.0 })
      useAppStore.getState().saveProfile('Profile A')

      useAppStore.getState().setViewerSettings({ exposure: 2.0 })
      useAppStore.getState().saveProfile('Profile B')

      expect(useAppStore.getState().viewerProfiles).toHaveLength(2)

      // Delete first, second remains
      useAppStore.getState().deleteProfile('uuid-1')
      expect(useAppStore.getState().viewerProfiles).toHaveLength(1)
      expect(useAppStore.getState().viewerProfiles[0].name).toBe('Profile B')

      // Restore original mock
      vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-123' })
    })
  })
})
