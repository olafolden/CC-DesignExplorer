import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../index'

const DEFAULT_SETTINGS = {
  isVisible: true,
  customMin: null,
  customMax: null,
  stepCount: 5,
}

describe('ParameterSettingsSlice', () => {
  beforeEach(() => {
    useAppStore.getState().resetParameterSettings()
  })

  it('initializes with empty parameterSettings', () => {
    expect(useAppStore.getState().parameterSettings).toEqual({})
  })

  it('setParameterVisible creates entry with defaults when key is new', () => {
    useAppStore.getState().setParameterVisible('area', false)
    expect(useAppStore.getState().parameterSettings.area).toEqual({
      ...DEFAULT_SETTINGS,
      isVisible: false,
    })
  })

  it('setParameterVisible updates existing entry', () => {
    useAppStore.getState().setParameterVisible('area', false)
    useAppStore.getState().setParameterVisible('area', true)
    expect(useAppStore.getState().parameterSettings.area.isVisible).toBe(true)
  })

  it('setParameterBounds sets custom min and max', () => {
    useAppStore.getState().setParameterBounds('height', 10, 100)
    const settings = useAppStore.getState().parameterSettings.height
    expect(settings.customMin).toBe(10)
    expect(settings.customMax).toBe(100)
  })

  it('setParameterBounds allows null to clear overrides', () => {
    useAppStore.getState().setParameterBounds('height', 10, 100)
    useAppStore.getState().setParameterBounds('height', null, null)
    const settings = useAppStore.getState().parameterSettings.height
    expect(settings.customMin).toBeNull()
    expect(settings.customMax).toBeNull()
  })

  it('setParameterStepCount updates stepCount', () => {
    useAppStore.getState().setParameterStepCount('width', 10)
    expect(useAppStore.getState().parameterSettings.width.stepCount).toBe(10)
  })

  it('resetParameterSettings clears all overrides', () => {
    useAppStore.getState().setParameterVisible('a', false)
    useAppStore.getState().setParameterBounds('b', 0, 50)
    useAppStore.getState().setParameterStepCount('c', 8)

    useAppStore.getState().resetParameterSettings()
    expect(useAppStore.getState().parameterSettings).toEqual({})
  })

  it('actions preserve settings for other keys', () => {
    useAppStore.getState().setParameterVisible('a', false)
    useAppStore.getState().setParameterBounds('b', 0, 50)

    expect(useAppStore.getState().parameterSettings.a.isVisible).toBe(false)
    expect(useAppStore.getState().parameterSettings.b.customMin).toBe(0)
  })
})
