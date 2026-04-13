export interface AssetEntry {
  imageUrl: string | null
  modelUrls: Record<string, string>
}

export type AssetMap = Record<string, AssetEntry>
