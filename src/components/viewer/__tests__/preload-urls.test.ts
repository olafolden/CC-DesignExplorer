import { describe, it, expect } from 'vitest'
import type { AssetMap } from '@/types/assets'

/**
 * Tests for the URL collection logic used to preload GLB models.
 * The function extracts all unique model URLs from an AssetMap.
 */

export function collectModelUrls(assetMap: AssetMap): string[] {
  const urls = new Set<string>()
  for (const entry of Object.values(assetMap)) {
    for (const url of Object.values(entry.modelUrls)) {
      urls.add(url)
    }
  }
  return Array.from(urls)
}

describe('collectModelUrls', () => {
  it('returns empty array for empty asset map', () => {
    expect(collectModelUrls({})).toEqual([])
  })

  it('extracts model URLs from a single design', () => {
    const map: AssetMap = {
      design_0: { imageUrl: '/img/0.png', modelUrls: { default: '/models/0.glb' } },
    }
    expect(collectModelUrls(map)).toEqual(['/models/0.glb'])
  })

  it('extracts model URLs from multiple designs', () => {
    const map: AssetMap = {
      design_0: { imageUrl: null, modelUrls: { default: '/models/0.glb' } },
      design_1: { imageUrl: null, modelUrls: { default: '/models/1.glb' } },
      design_2: { imageUrl: null, modelUrls: { default: '/models/2.glb' } },
    }
    const urls = collectModelUrls(map)
    expect(urls).toHaveLength(3)
    expect(urls).toContain('/models/0.glb')
    expect(urls).toContain('/models/1.glb')
    expect(urls).toContain('/models/2.glb')
  })

  it('extracts URLs from multiple categories', () => {
    const map: AssetMap = {
      design_0: {
        imageUrl: null,
        modelUrls: { default: '/models/0.glb', massing: '/models/0_massing.glb' },
      },
    }
    const urls = collectModelUrls(map)
    expect(urls).toHaveLength(2)
    expect(urls).toContain('/models/0.glb')
    expect(urls).toContain('/models/0_massing.glb')
  })

  it('deduplicates the same URL across designs', () => {
    const sharedUrl = '/models/shared.glb'
    const map: AssetMap = {
      design_0: { imageUrl: null, modelUrls: { default: sharedUrl } },
      design_1: { imageUrl: null, modelUrls: { default: sharedUrl } },
    }
    const urls = collectModelUrls(map)
    expect(urls).toHaveLength(1)
    expect(urls[0]).toBe(sharedUrl)
  })

  it('ignores designs with no model URLs', () => {
    const map: AssetMap = {
      design_0: { imageUrl: '/img/0.png', modelUrls: {} },
      design_1: { imageUrl: null, modelUrls: { default: '/models/1.glb' } },
    }
    const urls = collectModelUrls(map)
    expect(urls).toEqual(['/models/1.glb'])
  })

  it('handles mix of categories and designs', () => {
    const map: AssetMap = {
      design_0: {
        imageUrl: null,
        modelUrls: { default: '/a.glb', massing: '/b.glb', daylight: '/c.glb' },
      },
      design_1: {
        imageUrl: null,
        modelUrls: { default: '/d.glb', massing: '/b.glb' }, // /b.glb is shared
      },
    }
    const urls = collectModelUrls(map)
    expect(urls).toHaveLength(4)
    expect(urls).toContain('/a.glb')
    expect(urls).toContain('/b.glb')
    expect(urls).toContain('/c.glb')
    expect(urls).toContain('/d.glb')
  })
})
