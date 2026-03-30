import type { ColumnMeta, DesignIteration } from '@/types/design'

interface ParseResult {
  data: DesignIteration[]
  columns: ColumnMeta[]
}

interface WrappedFormat {
  columns: {
    inputs: string[]
    outputs: string[]
  }
  data: Record<string, unknown>[]
}

function isWrappedFormat(json: unknown): json is WrappedFormat {
  return (
    typeof json === 'object' &&
    json !== null &&
    'columns' in json &&
    'data' in json &&
    Array.isArray((json as WrappedFormat).data)
  )
}

export function parseDesignData(jsonString: string): ParseResult {
  const json = JSON.parse(jsonString) as unknown

  let raw: Record<string, unknown>[]
  let inputKeys: Set<string> | null = null
  let outputKeys: Set<string> | null = null

  if (isWrappedFormat(json)) {
    raw = json.data
    inputKeys = new Set(json.columns.inputs)
    outputKeys = new Set(json.columns.outputs)
  } else if (Array.isArray(json)) {
    raw = json as Record<string, unknown>[]
  } else {
    throw new Error('JSON must be an array of objects or a { columns, data } wrapper')
  }

  if (raw.length === 0) {
    throw new Error('Data array must not be empty')
  }

  const hasId = 'id' in raw[0]
  const data: DesignIteration[] = raw.map((row, i) => ({
    ...row,
    id: hasId ? String(row.id) : `design_${i}`,
  })) as DesignIteration[]

  const sampleRow = raw[0]
  const columns: ColumnMeta[] = Object.keys(sampleRow)
    .filter((key) => key !== 'id')
    .map((key) => {
      const values = raw.map((r) => r[key])
      const isNumeric = values.every((v) => typeof v === 'number')

      // Determine role: explicit from wrapper, or infer
      let role: 'input' | 'output' = 'input'
      if (inputKeys && outputKeys) {
        role = outputKeys.has(key) ? 'output' : inputKeys.has(key) ? 'input' : 'input'
      }

      const col: ColumnMeta = {
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        type: isNumeric ? 'number' : 'string',
        role,
      }

      if (isNumeric) {
        const nums = values as number[]
        col.min = Math.min(...nums)
        col.max = Math.max(...nums)
      }

      return col
    })

  // Sort: inputs first, then outputs (preserving order within each group)
  const inputCols = columns.filter((c) => c.role === 'input')
  const outputCols = columns.filter((c) => c.role === 'output')
  const sortedColumns = [...inputCols, ...outputCols]

  return { data, columns: sortedColumns }
}

interface FileEntry {
  name: string
  file: File
}

async function traverseDirectory(
  entry: FileSystemDirectoryEntry
): Promise<FileEntry[]> {
  const files: FileEntry[] = []
  const reader = entry.createReader()

  const readBatch = (): Promise<FileSystemEntry[]> =>
    new Promise((resolve, reject) => reader.readEntries(resolve, reject))

  let batch = await readBatch()
  while (batch.length > 0) {
    for (const child of batch) {
      if (child.isFile) {
        const fileEntry = child as FileSystemFileEntry
        const file = await new Promise<File>((resolve, reject) =>
          fileEntry.file(resolve, reject)
        )
        files.push({ name: child.name, file })
      } else if (child.isDirectory) {
        const subFiles = await traverseDirectory(child as FileSystemDirectoryEntry)
        files.push(...subFiles)
      }
    }
    batch = await readBatch()
  }

  return files
}

function getDesignIdFromFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, '')
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']
const MODEL_EXTENSIONS = ['.glb', '.gltf']

export interface AssetFileEntry {
  name: string
  file: File
  designKey: string
  assetType: 'image' | 'model'
}

export async function collectAssetFiles(
  dataTransfer: DataTransfer
): Promise<AssetFileEntry[]> {
  const items = Array.from(dataTransfer.items)
  const entries = items
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => e != null)

  const allFiles: FileEntry[] = []

  for (const entry of entries) {
    if (entry.isDirectory) {
      const dirFiles = await traverseDirectory(entry as FileSystemDirectoryEntry)
      allFiles.push(...dirFiles)
    } else if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry
      const file = await new Promise<File>((resolve, reject) =>
        fileEntry.file(resolve, reject)
      )
      allFiles.push({ name: entry.name, file })
    }
  }

  const result: AssetFileEntry[] = []

  for (const { name, file } of allFiles) {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
    const designKey = getDesignIdFromFilename(name)

    if (IMAGE_EXTENSIONS.includes(ext)) {
      result.push({ name, file, designKey, assetType: 'image' })
    } else if (MODEL_EXTENSIONS.includes(ext)) {
      result.push({ name, file, designKey, assetType: 'model' })
    }
  }

  return result
}
