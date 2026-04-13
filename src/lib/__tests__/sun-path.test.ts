import { describe, it, expect } from 'vitest'
import { computeSunPath } from '../sun-path'

describe('computeSunPath', () => {
  it('returns correct shape', () => {
    const result = computeSunPath('2026-06-21', 12.0, 52.52, 13.405)

    expect(result).toHaveProperty('sunPosition')
    expect(result).toHaveProperty('arcPoints')
    expect(result).toHaveProperty('sunAltitude')
    expect(result).toHaveProperty('sunAzimuth')
    expect(result.sunPosition).toHaveProperty('x')
    expect(result.sunPosition).toHaveProperty('y')
    expect(result.sunPosition).toHaveProperty('z')
  })

  it('computes high altitude at noon on summer solstice near equator', () => {
    // Equator, summer solstice, noon → sun nearly overhead
    const result = computeSunPath('2026-06-21', 12.0, 0, 0)

    // Altitude should be high (above 1 radian ~ 57 degrees)
    expect(result.sunAltitude).toBeGreaterThan(0.8)
    // Sun position Y should be high (close to sceneRadius)
    expect(result.sunPosition.y).toBeGreaterThan(3)
  })

  it('computes arc points with all positive Y values', () => {
    const result = computeSunPath('2026-06-21', 12.0, 52.52, 13.405)

    // All arc points should be above the horizon
    for (const point of result.arcPoints) {
      expect(point.y).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns multiple arc points for a full day', () => {
    const result = computeSunPath('2026-06-21', 12.0, 52.52, 13.405)

    // Summer solstice at 52°N → long day, should have many arc points
    expect(result.arcPoints.length).toBeGreaterThan(10)
  })

  it('returns negative altitude at night', () => {
    // Midnight at the equator → sun below horizon
    const result = computeSunPath('2026-06-21', 0, 0, 0)

    expect(result.sunAltitude).toBeLessThan(0)
    expect(result.sunPosition.y).toBeLessThan(0)
  })

  it('respects sceneRadius parameter', () => {
    const small = computeSunPath('2026-06-21', 12.0, 0, 0, 2)
    const large = computeSunPath('2026-06-21', 12.0, 0, 0, 10)

    // Larger radius → further away sun position
    const distSmall = Math.sqrt(small.sunPosition.x ** 2 + small.sunPosition.y ** 2 + small.sunPosition.z ** 2)
    const distLarge = Math.sqrt(large.sunPosition.x ** 2 + large.sunPosition.y ** 2 + large.sunPosition.z ** 2)

    expect(distLarge).toBeGreaterThan(distSmall)
    expect(distSmall).toBeCloseTo(2, 0)
    expect(distLarge).toBeCloseTo(10, 0)
  })

  it('handles winter solstice with shorter arc', () => {
    const summer = computeSunPath('2026-06-21', 12.0, 60, 0)
    const winter = computeSunPath('2026-12-21', 12.0, 60, 0)

    // Winter at 60°N → shorter day, fewer arc points
    expect(winter.arcPoints.length).toBeLessThan(summer.arcPoints.length)
    // Winter sun altitude is lower
    expect(winter.sunAltitude).toBeLessThan(summer.sunAltitude)
  })
})
