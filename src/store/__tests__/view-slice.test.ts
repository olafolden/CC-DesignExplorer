import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../index'

describe('ViewSlice', () => {
  beforeEach(() => {
    useAppStore.setState({
      viewMode: '3d',
      colorMetricKey: null,
      activeCategory: 'default',
    })
  })

  it('initializes activeCategory to "default"', () => {
    expect(useAppStore.getState().activeCategory).toBe('default')
  })

  it('setActiveCategory updates the active category', () => {
    useAppStore.getState().setActiveCategory('massing')
    expect(useAppStore.getState().activeCategory).toBe('massing')
  })

  it('setActiveCategory can switch between categories', () => {
    useAppStore.getState().setActiveCategory('massing')
    useAppStore.getState().setActiveCategory('daylight')
    expect(useAppStore.getState().activeCategory).toBe('daylight')
  })

  it('setActiveCategory can reset to default', () => {
    useAppStore.getState().setActiveCategory('massing')
    useAppStore.getState().setActiveCategory('default')
    expect(useAppStore.getState().activeCategory).toBe('default')
  })

  it('resetUIForNewDataset resets activeCategory to default', () => {
    useAppStore.getState().setActiveCategory('daylight')
    useAppStore.getState().resetUIForNewDataset()
    expect(useAppStore.getState().activeCategory).toBe('default')
  })
})
