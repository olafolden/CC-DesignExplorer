import type { ColumnMeta, DesignIteration } from '@/types/design'
import type { AssetEntry } from '@/types/assets'

interface ParseResult {
  data: DesignIteration[]
  columns: ColumnMeta[]
}

export function parseDesignData(jsonString: string): ParseResult {
  const raw = JSON.parse(jsonString) as Record<string, unknown>[]

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('JSON must be a non-empty array of objects')
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

      const col: ColumnMeta = {
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        type: isNumeric ? 'number' : 'string',
      }

      if (isNumeric) {
        const nums = values as number[]
        col.min = Math.min(...nums)
        col.max = Math.max(...nums)
      }

      return col
    })

  return { data, columns }
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

export async function processAssetDrop(
  dataTransfer: DataTransfer
): Promise<Record<string, AssetEntry>> {
  const assetMap: Record<string, AssetEntry> = {}

  const items = Array.from(dataTransfer.items)
  const entries = items
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => e != null)

  let allFiles: FileEntry[] = []

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

  for (const { name, file } of allFiles) {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
    const designId = getDesignIdFromFilename(name)

    if (!assetMap[designId]) {
      assetMap[designId] = { imageUrl: null, modelUrl: null }
    }

    if (IMAGE_EXTENSIONS.includes(ext)) {
      assetMap[designId].imageUrl = URL.createObjectURL(file)
    } else if (MODEL_EXTENSIONS.includes(ext)) {
      assetMap[designId].modelUrl = URL.createObjectURL(file)
    }
  }

  return assetMap
}

export async function processFileInput(
  files: FileList
): Promise<Record<string, AssetEntry>> {
  const assetMap: Record<string, AssetEntry> = {}

  for (const file of Array.from(files)) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const designId = getDesignIdFromFilename(file.name)

    if (!assetMap[designId]) {
      assetMap[designId] = { imageUrl: null, modelUrl: null }
    }

    if (IMAGE_EXTENSIONS.includes(ext)) {
      assetMap[designId].imageUrl = URL.createObjectURL(file)
    } else if (MODEL_EXTENSIONS.includes(ext)) {
      assetMap[designId].modelUrl = URL.createObjectURL(file)
    }
  }

  return assetMap
}
