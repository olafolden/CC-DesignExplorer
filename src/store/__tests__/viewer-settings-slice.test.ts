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

    it('has sunPathEnabled as false', () => {
      expect(useAppStore.getState().viewerSettings.sunPathEnabled).toBe(false)
    })

    it('has sunDate as 2026-06-21', () => {
      expect(useAppStore.getState().viewerSettings.sunDate).toBe('2026-06-21')
    })

    it('has sunTime as 12.0', () => {
      expect(useAppStore.getState().viewerSettings.sunTime).toBe(12.0)
    })

    it('has sunLatitude as 52.52', () => {
      expect(useAppStore.getState().viewerSettings.sunLatitude).toBe(52.52)
    })

    it('setViewerSettings updates sun path fields', () => {
      useAppStore.getState().setViewerSettings({ sunPathEnabled: true, sunTime: 14.5, sunLatitude: 40.0 })
      const s = useAppStore.getState().viewerSettings
      expect(s.sunPathEnabled).toBe(true)
      expect(s.sunTime).toBe(14.5)
      expect(s.sunLatitude).toBe(40.0)
    })

    it('resetViewerSettings restores sun path defaults', () => {
      useAppStore.getState().setViewerSettings({ sunPathEnabled: true, sunTime: 8.0, sunLatitude: -30 })
      useAppStore.getState().resetViewerSettings()
      const s = useAppStore.getState().viewerSettings
      expect(s.sunPathEnabled).toBe(false)
      expect(s.sunTime).toBe(12.0)
      expect(s.sunLatitude).toBe(52.52)
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
