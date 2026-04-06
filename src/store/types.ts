export interface BrushRange {
  axisIndex: number
  key: string
  range: [number, number]
}

export interface FilterSlice {
  brushRanges: BrushRange[]
  setBrushRanges: (ranges: BrushRange[]) => void
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

export interface ProjectSlice {
  currentProjectId: string | null
  currentDatasetId: string | null
  setCurrentProjectId: (id: string | null) => void
  setCurrentDatasetId: (id: string | null) => void
  resetUIForNewDataset: () => void
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

export type AppStore = FilterSlice &
  SelectionSlice &
  ViewSlice &
  UISlice &
  ProjectSlice &
  ViewerSettingsSlice
