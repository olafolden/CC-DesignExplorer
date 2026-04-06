import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../index'
import type { BrushRange } from '../types'

describe('FilterSlice', () => {
  beforeEach(() => {
    useAppStore.setState({ brushRanges: [] })
  })

  it('initializes with empty brushRanges', () => {
    expect(useAppStore.getState().brushRanges).toEqual([])
  })

  it('setBrushRanges updates brush ranges', () => {
    const ranges: BrushRange[] = [
      { axisIndex: 0, key: 'x', range: [15, 35] },
    ]
    useAppStore.getState().setBrushRanges(ranges)
    expect(useAppStore.getState().brushRanges).toEqual(ranges)
  })

  it('setBrushRanges replaces previous ranges', () => {
    useAppStore.getState().setBrushRanges([
      { axisIndex: 0, key: 'x', range: [15, 35] },
    ])
    const newRanges: BrushRange[] = [
      { axisIndex: 1, key: 'y', range: [250, 350] },
    ]
    useAppStore.getState().setBrushRanges(newRanges)
    expect(useAppStore.getState().brushRanges).toEqual(newRanges)
  })

  it('clearFilters resets brush ranges to empty', () => {
    useAppStore.getState().setBrushRanges([
      { axisIndex: 0, key: 'x', range: [15, 35] },
      { axisIndex: 1, key: 'y', range: [250, 350] },
    ])
    expect(useAppStore.getState().brushRanges.length).toBe(2)

    useAppStore.getState().clearFilters()
    expect(useAppStore.getState().brushRanges).toEqual([])
  })

  it('resetUIForNewDataset clears brushRanges along with other UI state', () => {
    useAppStore.getState().setBrushRanges([
      { axisIndex: 0, key: 'x', range: [15, 35] },
    ])
    useAppStore.getState().setSelectedDesignId('test-id')
    useAppStore.getState().setColorMetricKey('x')

    useAppStore.getState().resetUIForNewDataset()

    const state = useAppStore.getState()
    expect(state.brushRanges).toEqual([])
    expect(state.selectedDesignId).toBeNull()
    expect(state.hoveredDesignId).toBeNull()
    expect(state.colorMetricKey).toBeNull()
  })
})
