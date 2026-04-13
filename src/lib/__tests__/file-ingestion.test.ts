import { describe, it, expect } from 'vitest'
import { parseDesignData, parseAssetFilename } from '../file-ingestion'
import fs from 'fs'
import path from 'path'

describe('parseDesignData', () => {
  describe('flat array format', () => {
    it('parses a simple flat array of objects', () => {
      const json = JSON.stringify([
        { id: 'a', x: 1, y: 2 },
        { id: 'b', x: 3, y: 4 },
      ])
      const result = parseDesignData(json)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].id).toBe('a')
      expect(result.data[1].id).toBe('b')
    })

    it('auto-generates IDs when id field is absent', () => {
      const json = JSON.stringify([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ])
      const result = parseDesignData(json)
      expect(result.data[0].id).toBe('design_0')
      expect(result.data[1].id).toBe('design_1')
    })

    it('infers all columns as input role for flat arrays', () => {
      const json = JSON.stringify([{ id: 'a', x: 1, y: 2 }])
      const result = parseDesignData(json)
      expect(result.columns.every((c) => c.role === 'input')).toBe(true)
    })
  })

  describe('wrapped format', () => {
    it('parses { columns, data } wrapper', () => {
      const json = JSON.stringify({
        columns: { inputs: ['x'], outputs: ['y'] },
        data: [
          { id: 'a', x: 1, y: 10 },
          { id: 'b', x: 2, y: 20 },
        ],
      })
      const result = parseDesignData(json)
      expect(result.data).toHaveLength(2)
      expect(result.columns.find((c) => c.key === 'x')?.role).toBe('input')
      expect(result.columns.find((c) => c.key === 'y')?.role).toBe('output')
    })

    it('sorts columns: inputs first, then outputs', () => {
      const json = JSON.stringify({
        columns: { inputs: ['b_input'], outputs: ['a_output'] },
        data: [{ id: 'a', a_output: 10, b_input: 1 }],
      })
      const result = parseDesignData(json)
      expect(result.columns[0].role).toBe('input')
      expect(result.columns[1].role).toBe('output')
    })
  })

  describe('column inference', () => {
    it('detects numeric columns', () => {
      const json = JSON.stringify([
        { id: 'a', val: 1 },
        { id: 'b', val: 2 },
      ])
      const result = parseDesignData(json)
      const col = result.columns.find((c) => c.key === 'val')!
      expect(col.type).toBe('number')
    })

    it('detects string columns', () => {
      const json = JSON.stringify([
        { id: 'a', name: 'foo' },
        { id: 'b', name: 'bar' },
      ])
      const result = parseDesignData(json)
      const col = result.columns.find((c) => c.key === 'name')!
      expect(col.type).toBe('string')
      expect(col.min).toBeUndefined()
      expect(col.max).toBeUndefined()
    })

    it('calculates min and max for numeric columns', () => {
      const json = JSON.stringify([
        { id: 'a', val: 10 },
        { id: 'b', val: 30 },
        { id: 'c', val: 20 },
      ])
      const result = parseDesignData(json)
      const col = result.columns.find((c) => c.key === 'val')!
      expect(col.min).toBe(10)
      expect(col.max).toBe(30)
    })

    it('formats labels from snake_case to Title Case', () => {
      const json = JSON.stringify([{ id: 'a', floor_area: 100 }])
      const result = parseDesignData(json)
      const col = result.columns.find((c) => c.key === 'floor_area')!
      expect(col.label).toBe('Floor Area')
    })

    it('excludes id from columns list', () => {
      const json = JSON.stringify([{ id: 'a', x: 1 }])
      const result = parseDesignData(json)
      expect(result.columns.find((c) => c.key === 'id')).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('throws on empty array', () => {
      expect(() => parseDesignData('[]')).toThrow('Data array must not be empty')
    })

    it('throws on non-array, non-wrapped input', () => {
      expect(() => parseDesignData('"hello"')).toThrow(
        'JSON must be an array of objects or a { columns, data } wrapper'
      )
    })

    it('throws on invalid JSON', () => {
      expect(() => parseDesignData('not json')).toThrow()
    })

    it('throws on object without columns/data structure', () => {
      expect(() => parseDesignData('{"foo": "bar"}')).toThrow()
    })
  })

  describe('parseAssetFilename', () => {
    it('parses a plain design filename with no category', () => {
      expect(parseAssetFilename('design_0.glb')).toEqual({
        designKey: 'design_0',
        category: 'default',
      })
    })

    it('parses a design filename with a category suffix', () => {
      expect(parseAssetFilename('design_0_massing.glb')).toEqual({
        designKey: 'design_0',
        category: 'massing',
      })
    })

    it('parses a higher-numbered design with category', () => {
      expect(parseAssetFilename('design_12_daylight.glb')).toEqual({
        designKey: 'design_12',
        category: 'daylight',
      })
    })

    it('does not split on numeric-only segments', () => {
      // design_0 should NOT become designKey='design', category='0'
      expect(parseAssetFilename('design_0.glb')).toEqual({
        designKey: 'design_0',
        category: 'default',
      })
    })

    it('does not split on segments starting with a digit', () => {
      expect(parseAssetFilename('design_0_3dview.glb')).toEqual({
        designKey: 'design_0_3dview',
        category: 'default',
      })
    })

    it('handles image files the same way', () => {
      expect(parseAssetFilename('design_0.png')).toEqual({
        designKey: 'design_0',
        category: 'default',
      })
    })

    it('handles filenames without underscores', () => {
      expect(parseAssetFilename('mymodel.glb')).toEqual({
        designKey: 'mymodel',
        category: 'default',
      })
    })

    it('handles multi-underscore design keys', () => {
      expect(parseAssetFilename('my_custom_design_0_massing.glb')).toEqual({
        designKey: 'my_custom_design_0',
        category: 'massing',
      })
    })

    it('handles context.glb as __context__ with default category', () => {
      expect(parseAssetFilename('context.glb')).toEqual({
        designKey: '__context__',
        category: 'default',
      })
    })

    it('handles context_terrain.glb as __context__ with terrain category', () => {
      expect(parseAssetFilename('context_terrain.glb')).toEqual({
        designKey: '__context__',
        category: 'terrain',
      })
    })

    it('handles context_buildings.glb as __context__ with buildings category', () => {
      expect(parseAssetFilename('context_buildings.glb')).toEqual({
        designKey: '__context__',
        category: 'buildings',
      })
    })

    it('does not treat "contextual" as a context file', () => {
      // Only exact 'context' or 'context_*' should match
      const result = parseAssetFilename('contextual.glb')
      expect(result.designKey).not.toBe('__context__')
    })
  })

  describe('real test data file', () => {
    it('parses test-data/data.json correctly', () => {
      const filePath = path.resolve(__dirname, '../../../test-data/data.json')
      const jsonString = fs.readFileSync(filePath, 'utf-8')
      const result = parseDesignData(jsonString)

      // 20 designs
      expect(result.data).toHaveLength(20)

      // All have proper IDs
      expect(result.data[0].id).toBe('design_0')
      expect(result.data[19].id).toBe('design_19')

      // 4 inputs + 5 outputs = 9 columns
      expect(result.columns).toHaveLength(9)

      // Inputs come first
      const inputCols = result.columns.filter((c) => c.role === 'input')
      const outputCols = result.columns.filter((c) => c.role === 'output')
      expect(inputCols).toHaveLength(4)
      expect(outputCols).toHaveLength(5)

      // All inputs appear before all outputs
      const firstOutputIdx = result.columns.findIndex((c) => c.role === 'output')
      const lastInputIdx = result.columns.length - 1 - [...result.columns].reverse().findIndex((c) => c.role === 'input')
      expect(lastInputIdx).toBeLessThan(firstOutputIdx)

      // All columns are numeric
      expect(result.columns.every((c) => c.type === 'number')).toBe(true)

      // Min/max are set
      const floorArea = result.columns.find((c) => c.key === 'floor_area')!
      expect(floorArea.min).toBe(2200)
      expect(floorArea.max).toBe(3100)
    })
  })
})
