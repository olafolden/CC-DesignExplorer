export interface AssetEntry {
  imageUrl: string | null
  modelUrls: Record<string, string>
}

export type AssetMap = Record<string, AssetEntry>

export interface AssetUrlsResponse {
  assets: AssetMap
  contextModelUrl: string | null
  contextModelUrls: Record<string, string> | null
}
