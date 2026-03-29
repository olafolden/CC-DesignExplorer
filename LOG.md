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
