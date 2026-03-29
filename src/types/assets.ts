export interface AssetEntry {
  imageUrl: string | null
  modelUrl: string | null
}

export type AssetMap = Record<string, AssetEntry>
