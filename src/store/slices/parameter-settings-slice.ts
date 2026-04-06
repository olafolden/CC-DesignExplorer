import type { StateCreator } from 'zustand'
import type { AppStore, ParameterSettingsSlice, ParameterSettings } from '../types'

const DEFAULT_SETTINGS: ParameterSettings = {
  isVisible: true,
  customMin: null,
  customMax: null,
  stepCount: 5,
}

export const createParameterSettingsSlice: StateCreator<
  AppStore,
  [],
  [],
  ParameterSettingsSlice
> = (set) => ({
  parameterSettings: {},

  setParameterVisible: (key, visible) =>
    set((state) => ({
      parameterSettings: {
        ...state.parameterSettings,
        [key]: {
          ...DEFAULT_SETTINGS,
          ...state.parameterSettings[key],
          isVisible: visible,
        },
      },
    })),

  setParameterBounds: (key, min, max) =>
    set((state) => ({
      parameterSettings: {
        ...state.parameterSettings,
        [key]: {
          ...DEFAULT_SETTINGS,
          ...state.parameterSettings[key],
          customMin: min,
          customMax: max,
        },
      },
    })),

  setParameterStepCount: (key, count) =>
    set((state) => ({
      parameterSettings: {
        ...state.parameterSettings,
        [key]: {
          ...DEFAULT_SETTINGS,
          ...state.parameterSettings[key],
          stepCount: count,
        },
      },
    })),

  resetParameterSettings: () => set({ parameterSettings: {} }),
})
