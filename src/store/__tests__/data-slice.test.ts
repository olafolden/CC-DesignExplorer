import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../index'
import type { DesignIteration } from '@/types/design'
import type { ColumnMeta } from '@/types/design'

const testData: DesignIteration[] = [
  { id: 'a', x: 10, name: 'foo' },
  { id: 'b', x: 20, name: 'bar' },
]

const testColumns: ColumnMeta[] = [
  { key: 'x', label: 'X', type: 'number', role: 'input', min: 10, max: 20 },
  { key: 'name', label: 'Name', type: 'string', role: 'input' },
]

describe('DataSlice', () => {
  beforeEach(() => {
    // Reset to clean state
    useAppStore.setState({
      rawData: [],
      columns: [],
      isDataLoaded: false,
      filteredIds: new Set<string>(),
      brushRanges: [],
      colorMetricKey: null,
      selectedDesignId: null,
      hoveredDesignId: null,
    })
  })

  it('setRawData populates data, columns, and isDataLoaded', () => {
    useAppStore.getState().setRawData(testData, testColumns)
    const state = useAppStore.getState()
    expect(state.rawData).toEqual(testData)
    expect(state.columns).toEqual(testColumns)
    expect(state.isDataLoaded).toBe(true)
  })

  it('setRawData initializes filteredIds to all design IDs', () => {
    useAppStore.getState().setRawData(testData, testColumns)
    const { filteredIds } = useAppStore.getState()
    expect(filteredIds.size).toBe(2)
    expect(filteredIds.has('a')).toBe(true)
    expect(filteredIds.has('b')).toBe(true)
  })

  it('setRawData auto-selects first numeric column as colorMetricKey', () => {
    useAppStore.getState().setRawData(testData, testColumns)
    expect(useAppStore.getState().colorMetricKey).toBe('x')
  })

  it('setRawData sets colorMetricKey to null when no numeric columns', () => {
    const stringOnlyCols: ColumnMeta[] = [
      { key: 'name', label: 'Name', type: 'string', role: 'input' },
    ]
    useAppStore.getState().setRawData(testData, stringOnlyCols)
    expect(useAppStore.getState().colorMetricKey).toBeNull()
  })

  it('setRawData resets selection and brush ranges', () => {
    // Set some state first
    useAppStore.setState({
      selectedDesignId: 'a',
      hoveredDesignId: 'b',
      brushRanges: [{ axisIndex: 0, key: 'x', range: [10, 20] }],
    })

    useAppStore.getState().setRawData(testData, testColumns)
    const state = useAppStore.getState()
    expect(state.selectedDesignId).toBeNull()
    expect(state.hoveredDesignId).toBeNull()
    expect(state.brushRanges).toHaveLength(0)
  })

  it('clearData resets everything to empty state', () => {
    useAppStore.getState().setRawData(testData, testColumns)
    useAppStore.getState().clearData()

    const state = useAppStore.getState()
    expect(state.rawData).toEqual([])
    expect(state.columns).toEqual([])
    expect(state.isDataLoaded).toBe(false)
    expect(state.filteredIds.size).toBe(0)
    expect(state.colorMetricKey).toBeNull()
    expect(state.selectedDesignId).toBeNull()
    expect(state.assetMap).toEqual({})
  })
})
