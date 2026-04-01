import type { ColumnMeta, DesignIteration } from '@/types/design'
import type { AssetEntry } from '@/types/assets'

export interface BrushRange {
  axisIndex: number
  key: string
  range: [number, number]
}

export interface DataSlice {
  rawData: DesignIteration[]
  columns: ColumnMeta[]
  isDataLoaded: boolean
  setRawData: (data: DesignIteration[], columns: ColumnMeta[]) => void
  clearData: () => void
}

export interface FilterSlice {
  brushRanges: BrushRange[]
  filteredIds: Set<string>
  setBrushRanges: (ranges: BrushRange[]) => void
  recomputeFilteredIds: () => void
  clearFilters: () => void
}

export interface SelectionSlice {
  selectedDesignId: string | null
  hoveredDesignId: string | null
  setSelectedDesignId: (id: string | null) => void
  setHoveredDesignId: (id: string | null) => void
}

export interface ViewSlice {
  viewMode: '2d' | '3d' | 'catalogue'
  colorMetricKey: string | null
  setViewMode: (mode: '2d' | '3d' | 'catalogue') => void
  setColorMetricKey: (key: string | null) => void
}

export interface AssetSlice {
  assetMap: Record<string, AssetEntry>
  isAssetsLoaded: boolean
  setAssetMap: (map: Record<string, AssetEntry>) => void
  mergeAssetMap: (partial: Record<string, AssetEntry>) => void
  clearAssets: () => void
}

export interface UISlice {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  panelsSwapped: boolean
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  togglePanelSwap: () => void
}

export interface ProjectInfo {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface ProjectSlice {
  currentProjectId: string | null
  currentDatasetId: string | null
  projects: ProjectInfo[]
  isHydrating: boolean
  setCurrentProjectId: (id: string | null) => void
  setCurrentDatasetId: (id: string | null) => void
  setProjects: (projects: ProjectInfo[]) => void
  setIsHydrating: (v: boolean) => void
}

export interface ViewerSettings {
  backgroundColor: string
  gridVisible: boolean
  gridSize: number
  ambientIntensity: number
  directionalIntensity: number
  exposure: number
  autoRotate: boolean
  fov: number
  wireframe: boolean
  opacity: number
  doubleSided: boolean
}

export interface ViewerSettingsSlice {
  viewerSettings: ViewerSettings
  setViewerSettings: (partial: Partial<ViewerSettings>) => void
  resetViewerSettings: () => void
}

export type AppStore = DataSlice &
  FilterSlice &
  SelectionSlice &
  ViewSlice &
  AssetSlice &
  UISlice &
  ProjectSlice &
  ViewerSettingsSlice
