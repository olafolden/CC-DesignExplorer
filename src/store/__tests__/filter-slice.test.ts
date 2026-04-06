import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../index'
import type { DesignIteration } from '@/types/design'
import type { ColumnMeta } from '@/types/design'

const testData: DesignIteration[] = [
  { id: 'a', x: 10, y: 100 },
  { id: 'b', x: 20, y: 200 },
  { id: 'c', x: 30, y: 300 },
  { id: 'd', x: 40, y: 400 },
]

const testColumns: ColumnMeta[] = [
  { key: 'x', label: 'X', type: 'number', role: 'input', min: 10, max: 40 },
  { key: 'y', label: 'Y', type: 'number', role: 'output', min: 100, max: 400 },
]

describe('FilterSlice', () => {
  beforeEach(() => {
    // Reset store and load test data
    const store = useAppStore.getState()
    store.setRawData(testData, testColumns)
  })

  it('initializes filteredIds to all IDs when data is loaded', () => {
    const { filteredIds } = useAppStore.getState()
    expect(filteredIds.size).toBe(4)
    expect(filteredIds.has('a')).toBe(true)
    expect(filteredIds.has('d')).toBe(true)
  })

  it('recomputeFilteredIds with no brushes returns all IDs', () => {
    useAppStore.getState().recomputeFilteredIds()
    const { filteredIds } = useAppStore.getState()
    expect(filteredIds.size).toBe(4)
  })

  it('filters by a single brush range', () => {
    useAppStore.getState().setBrushRanges([
      { axisIndex: 0, key: 'x', range: [15, 35] },
    ])
    const { filteredIds } = useAppStore.getState()
    // x: 20, 30 match; 10, 40 are outside
    expect(filteredIds.size).toBe(2)
    expect(filteredIds.has('b')).toBe(true)
    expect(filteredIds.has('c')).toBe(true)
    expect(filteredIds.has('a')).toBe(false)
    expect(filteredIds.has('d')).toBe(false)
  })

  it('filters with multiple brush ranges (AND logic)', () => {
    useAppStore.getState().setBrushRanges([
      { axisIndex: 0, key: 'x', range: [15, 35] },
      { axisIndex: 1, key: 'y', range: [250, 350] },
    ])
    const { filteredIds } = useAppStore.getState()
    // x in [15,35]: b(20), c(30)
    // y in [250,350]: c(300)
    // AND: only c
    expect(filteredIds.size).toBe(1)
    expect(filteredIds.has('c')).toBe(true)
  })

  it('clearFilters resets to all IDs and clears brush ranges', () => {
    useAppStore.getState().setBrushRanges([
      { axisIndex: 0, key: 'x', range: [15, 25] },
    ])
    expect(useAppStore.getState().filteredIds.size).toBe(1)

    useAppStore.getState().clearFilters()
    const { filteredIds, brushRanges } = useAppStore.getState()
    expect(filteredIds.size).toBe(4)
    expect(brushRanges).toHaveLength(0)
  })
})
