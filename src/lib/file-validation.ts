export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.glb', '.gltf'] as const

interface ValidationResult {
  valid: boolean
  error?: string
}

interface ExtensionResult extends ValidationResult {
  ext: string
}

interface UploadValidationResult {
  valid: boolean
  errors: string[]
}

export function validateFileSize(size: number): ValidationResult {
  if (size <= 0) {
    return { valid: false, error: 'File is empty or has invalid size' }
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    const limitMB = MAX_FILE_SIZE_BYTES / (1024 * 1024)
    return { valid: false, error: `File exceeds ${limitMB} MB size limit` }
  }
  return { valid: true }
}

export function validateExtension(filename: string): ExtensionResult {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex <= 0) {
    return { valid: false, ext: '', error: `No valid file extension found` }
  }

  const ext = filename.substring(dotIndex).toLowerCase()

  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return { valid: false, ext, error: `Extension ${ext} is not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}` }
  }

  return { valid: true, ext }
}

const MAGIC_SIGNATURES: Record<string, { bytes: number[]; offset?: number }[]> = {
  '.png': [{ bytes: [0x89, 0x50, 0x4e, 0x47] }],
  '.jpg': [{ bytes: [0xff, 0xd8, 0xff] }],
  '.jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  '.webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
  ],
  '.glb': [{ bytes: [0x67, 0x6c, 0x54, 0x46] }], // "glTF"
}

export function validateMagicBytes(buffer: ArrayBuffer, ext: string): ValidationResult {
  if (buffer.byteLength === 0) {
    return { valid: false, error: 'File is empty' }
  }

  // GLTF is JSON text — special case
  if (ext === '.gltf') {
    return validateGltfJson(buffer)
  }

  const signatures = MAGIC_SIGNATURES[ext]
  if (!signatures) {
    return { valid: true } // Unknown extension, skip magic byte check
  }

  const bytes = new Uint8Array(buffer)

  for (const sig of signatures) {
    const offset = sig.offset ?? 0
    if (bytes.length < offset + sig.bytes.length) {
      return { valid: false, error: `File too small to be a valid ${ext} file` }
    }

    const matches = sig.bytes.every((b, i) => bytes[offset + i] === b)
    if (!matches) {
      return { valid: false, error: `File content does not match ${ext} format` }
    }
  }

  // WebP extra check: bytes 8-11 must be "WEBP"
  if (ext === '.webp') {
    const webpMark = [0x57, 0x45, 0x42, 0x50]
    if (bytes.length < 12) {
      return { valid: false, error: 'File too small to be a valid WebP file' }
    }
    const isWebp = webpMark.every((b, i) => bytes[8 + i] === b)
    if (!isWebp) {
      return { valid: false, error: 'File has RIFF header but is not a WebP file' }
    }
  }

  return { valid: true }
}

function validateGltfJson(buffer: ArrayBuffer): ValidationResult {
  try {
    const text = new TextDecoder().decode(buffer)
    const json = JSON.parse(text) as Record<string, unknown>
    if (!json.asset) {
      return { valid: false, error: 'GLTF file missing required "asset" field' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'GLTF file is not valid JSON' }
  }
}

export function validateUploadFile(file: {
  name: string
  size: number
  arrayBuffer: ArrayBuffer
}): UploadValidationResult {
  const errors: string[] = []

  const sizeResult = validateFileSize(file.size)
  if (!sizeResult.valid) errors.push(sizeResult.error!)

  const extResult = validateExtension(file.name)
  if (!extResult.valid) errors.push(extResult.error!)

  // Only check magic bytes if extension is valid (we need ext to know what to check)
  if (extResult.valid) {
    const magicResult = validateMagicBytes(file.arrayBuffer, extResult.ext)
    if (!magicResult.valid) errors.push(magicResult.error!)
  }

  return { valid: errors.length === 0, errors }
}
