import { describe, it, expect } from 'vitest'
import {
  validateFileSize,
  validateExtension,
  validateMagicBytes,
  validateUploadFile,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
} from '../file-validation'

describe('validateFileSize', () => {
  it('accepts files under the limit', () => {
    const result = validateFileSize(1024)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('accepts files exactly at the limit', () => {
    const result = validateFileSize(MAX_FILE_SIZE_BYTES)
    expect(result.valid).toBe(true)
  })

  it('rejects files over the limit', () => {
    const result = validateFileSize(MAX_FILE_SIZE_BYTES + 1)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('50')
  })

  it('rejects zero-byte files', () => {
    const result = validateFileSize(0)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('rejects negative size', () => {
    const result = validateFileSize(-1)
    expect(result.valid).toBe(false)
  })
})

describe('validateExtension', () => {
  it.each(ALLOWED_EXTENSIONS)('accepts %s extension', (ext) => {
    const result = validateExtension(`design_0${ext}`)
    expect(result.valid).toBe(true)
    expect(result.ext).toBe(ext)
  })

  it('accepts uppercase extensions', () => {
    const result = validateExtension('design_0.PNG')
    expect(result.valid).toBe(true)
    expect(result.ext).toBe('.png')
  })

  it('rejects disallowed extensions', () => {
    const result = validateExtension('malware.exe')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('.exe')
  })

  it('rejects files with no extension', () => {
    const result = validateExtension('noextension')
    expect(result.valid).toBe(false)
  })

  it('rejects hidden files', () => {
    const result = validateExtension('.htaccess')
    expect(result.valid).toBe(false)
  })

  it('handles double extensions by checking the last one', () => {
    const result = validateExtension('file.backup.png')
    expect(result.valid).toBe(true)
    expect(result.ext).toBe('.png')
  })
})

describe('validateMagicBytes', () => {
  function bufferFrom(bytes: number[]): ArrayBuffer {
    return new Uint8Array(bytes).buffer
  }

  it('validates PNG magic bytes', () => {
    const png = bufferFrom([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(4).fill(0)])
    expect(validateMagicBytes(png, '.png').valid).toBe(true)
  })

  it('rejects wrong magic bytes for PNG', () => {
    const notPng = bufferFrom([0xff, 0xd8, 0xff, 0xe0, ...Array(8).fill(0)])
    expect(validateMagicBytes(notPng, '.png').valid).toBe(false)
  })

  it('validates JPEG magic bytes', () => {
    const jpeg = bufferFrom([0xff, 0xd8, 0xff, 0xe0, ...Array(8).fill(0)])
    expect(validateMagicBytes(jpeg, '.jpg').valid).toBe(true)
    expect(validateMagicBytes(jpeg, '.jpeg').valid).toBe(true)
  })

  it('validates WebP magic bytes (RIFF + WEBP)', () => {
    // RIFF....WEBP
    const webp = bufferFrom([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // file size (don't care)
      0x57, 0x45, 0x42, 0x50, // WEBP
    ])
    expect(validateMagicBytes(webp, '.webp').valid).toBe(true)
  })

  it('rejects RIFF without WEBP signature', () => {
    const riffNotWebp = bufferFrom([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // AVI instead of WEBP
    ])
    expect(validateMagicBytes(riffNotWebp, '.webp').valid).toBe(false)
  })

  it('validates GLB magic bytes', () => {
    const glb = bufferFrom([0x67, 0x6c, 0x54, 0x46, ...Array(8).fill(0)])
    expect(validateMagicBytes(glb, '.glb').valid).toBe(true)
  })

  it('validates GLTF as JSON with asset field', () => {
    const json = JSON.stringify({ asset: { version: '2.0' }, scenes: [] })
    const encoder = new TextEncoder()
    const buffer = encoder.encode(json).buffer
    expect(validateMagicBytes(buffer, '.gltf').valid).toBe(true)
  })

  it('rejects GLTF JSON without asset field', () => {
    const json = JSON.stringify({ notGltf: true })
    const encoder = new TextEncoder()
    const buffer = encoder.encode(json).buffer
    expect(validateMagicBytes(buffer, '.gltf').valid).toBe(false)
  })

  it('rejects GLTF with invalid JSON', () => {
    const encoder = new TextEncoder()
    const buffer = encoder.encode('not json at all').buffer
    expect(validateMagicBytes(buffer, '.gltf').valid).toBe(false)
  })

  it('rejects empty buffer', () => {
    const empty = new ArrayBuffer(0)
    expect(validateMagicBytes(empty, '.png').valid).toBe(false)
  })

  it('rejects buffer too short for signature', () => {
    const short = bufferFrom([0x89, 0x50])
    expect(validateMagicBytes(short, '.png').valid).toBe(false)
  })
})

describe('validateUploadFile', () => {
  function makeFile(name: string, size: number, magicBytes: number[]): {
    name: string
    size: number
    arrayBuffer: ArrayBuffer
  } {
    return {
      name,
      size,
      arrayBuffer: new Uint8Array(magicBytes).buffer,
    }
  }

  it('passes for a valid PNG file', () => {
    const file = makeFile('design_0.png', 1024, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(4).fill(0)])
    const result = validateUploadFile(file)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('passes for a valid GLB file', () => {
    const file = makeFile('design_0.glb', 5000, [0x67, 0x6c, 0x54, 0x46, ...Array(8).fill(0)])
    const result = validateUploadFile(file)
    expect(result.valid).toBe(true)
  })

  it('collects multiple errors', () => {
    const file = makeFile('malware.exe', MAX_FILE_SIZE_BYTES + 1, [0x4d, 0x5a, ...Array(10).fill(0)])
    const result = validateUploadFile(file)
    expect(result.valid).toBe(false)
    // Should have both size and extension errors
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  it('reports magic byte mismatch even with valid extension and size', () => {
    // .png extension but JPEG magic bytes
    const file = makeFile('fake.png', 1024, [0xff, 0xd8, 0xff, 0xe0, ...Array(8).fill(0)])
    const result = validateUploadFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.toLowerCase().includes('content'))).toBe(true)
  })
})
