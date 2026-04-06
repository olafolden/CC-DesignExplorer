import { describe, it, expect } from 'vitest'
import { getColorHex, createColorScale } from '../colors'

describe('getColorHex', () => {
  it('returns grey when min equals max', () => {
    expect(getColorHex(5, 5, 5)).toBe('#6b7280')
  })

  it('returns blue-ish at minimum value (hue ~220)', () => {
    const hex = getColorHex(0, 0, 100)
    // At t=0, hue=220 -> blue range
    // Verify it's in the blue spectrum (low red, higher green/blue)
    const r = parseInt(hex.slice(1, 3), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    expect(b).toBeGreaterThan(r)
  })

  it('returns red-ish at maximum value (hue ~0)', () => {
    const hex = getColorHex(100, 0, 100)
    // At t=1, hue=0 -> red
    const r = parseInt(hex.slice(1, 3), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    expect(r).toBeGreaterThan(b)
  })

  it('returns a valid hex color string', () => {
    const hex = getColorHex(50, 0, 100)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('clamps values below min to min', () => {
    const atMin = getColorHex(0, 0, 100)
    const belowMin = getColorHex(-50, 0, 100)
    expect(belowMin).toBe(atMin)
  })

  it('clamps values above max to max', () => {
    const atMax = getColorHex(100, 0, 100)
    const aboveMax = getColorHex(200, 0, 100)
    expect(aboveMax).toBe(atMax)
  })

  it('produces different colors for different values', () => {
    const low = getColorHex(10, 0, 100)
    const mid = getColorHex(50, 0, 100)
    const high = getColorHex(90, 0, 100)
    expect(low).not.toBe(mid)
    expect(mid).not.toBe(high)
    expect(low).not.toBe(high)
  })
})

describe('createColorScale', () => {
  it('returns a function', () => {
    const scale = createColorScale(0, 100)
    expect(typeof scale).toBe('function')
  })

  it('returned function produces same results as getColorHex', () => {
    const scale = createColorScale(0, 100)
    expect(scale(0)).toBe(getColorHex(0, 0, 100))
    expect(scale(50)).toBe(getColorHex(50, 0, 100))
    expect(scale(100)).toBe(getColorHex(100, 0, 100))
  })

  it('handles equal min/max gracefully', () => {
    const scale = createColorScale(42, 42)
    expect(scale(42)).toBe('#6b7280')
  })
})
