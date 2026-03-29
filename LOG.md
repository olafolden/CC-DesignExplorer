# Design Explorer - Change Log

## Phase 1 — Scaffolding (2026-03-29)
- Vite 8 + React 19 + TypeScript + Tailwind v4 + shadcn/ui init
- 13 shadcn components added
- Zustand store: 6 slices (data, filter, selection, view, asset, ui)
- Types: DesignIteration, ColumnMeta, AssetEntry
- Lib: colors.ts (HSL interpolation), file-ingestion.ts (JSON + folder parser)
- Hooks: useTheme, useFilteredDesigns, useColorScale, useObjectUrl
- Basic layout shell with placeholder sidebar + main content
- GitHub repo created: olafolden/CC-DesignExplorer

## Phase 2 — Layout Shell (2026-03-29)
- Sidebar: collapsible w-64 <-> w-12, icon-only collapsed state with tooltips
- SidebarHeader: Compass logo, app title, collapse toggle
- SidebarContent: organized sections (Data, Visualization, Selection) with placeholder slots
- Collapsed sidebar: icon buttons with tooltip hints for future features
- ThemeToggle: supports both full-width and icon-only modes
- MainContent: resizable split pane (viewer top / chart bottom) via drag handle
- ResizeHandle: custom draggable divider with min 120px per panel
- Empty states: polished icons + guidance text for viewer and chart areas

## Phase 3 — Data Ingestion (2026-03-29)
- DropZone: drag-drop or click for data.json, visual states (idle/hover/loaded/error), clear button
- AssetDropZone: drag-drop folder or click (webkitdirectory fallback), processes images + models
- DataSummary: shows design count, parameter count, numeric vs categorical breakdown
- data-slice updated: setRawData now initializes filteredIds, colorMetricKey, resets selection
- clearData revokes all asset URLs and resets full store
- file-ingestion.ts: auto-detect ID field, infer ColumnMeta (min/max), folder traversal
- SidebarContent wired with real DropZone + AssetDropZone replacing placeholders
- test-data/data.json: 20 sample designs with 6 numeric parameters

## Phase 4 — Parallel Coordinates Chart (2026-03-29)
- ColumnMeta: added `role: 'input' | 'output'` field
- JSON format: supports `{ columns: { inputs, outputs }, data }` wrapper (backwards compatible with flat arrays)
- file-ingestion: parses wrapper format, sorts columns inputs-first then outputs
- test-data: 4 input params (floor_area, num_floors, glazing_ratio, wall_thickness) + 5 outputs (cost, carbon, energy_use, daylight_factor, structural_weight)
- ParallelCoordinates: ECharts parallel plot with `notMerge`, `lazyUpdate`
- Axis coloring: input axes sky-blue, output axes amber — labels and axis lines
- useChartOption: memoized option builder, color-maps lines by selected metric (blue-to-red HSL)
- useChartEvents: `axisareaselected` brush handler (debounced via rAF) -> store, click -> select design
- Filtered lines dim to 0.04 opacity, active lines at 0.55
- DataSummary: now shows input count (sky) and output count (amber) instead of numeric/categorical
- MainContent: renders chart when data loaded, empty state otherwise

## Phase 5 — 2D/3D Viewer (2026-03-29)
- ViewerPanel: orchestrates 2D/3D display based on viewMode + selected/hovered design ID
- ViewerToolbar: 2D/3D segmented toggle, displays selected design ID badge
- ImageViewer: renders image from assetMap blob URL, fade transition, skeleton loader, "no image" fallback
- ModelViewer: R3F Canvas with frameloop=demand, dpr=[1,2], antialias
- ModelScene: ambient + directional lights, OrbitControls, Environment preset=studio, Suspense with wireframe fallback
- DesignModel: useGLTF for GLB loading, auto-center/scale, applies color metric to mesh materials
- Color mapping: same blue-to-red scale from chart applied to 3D mesh material
- Hover preview: hoveredDesignId takes priority over selectedDesignId for live preview
- Empty states: context-aware messages (no data loaded vs no design selected)
