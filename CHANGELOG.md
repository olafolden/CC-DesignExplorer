# Design Explorer — Change Log

---

## v2: Next.js Migration

### Context Model Support (2026-04-13)
- Persistent "context" 3D model (e.g., site surroundings) stays visible regardless of active design
- Uses sentinel design key `__context__` within existing DB schema — no new tables
- Upload route auto-creates `__context__` design row when `context.glb` is uploaded
- `GET /api/assets/batch-urls` returns `contextModelUrl` and `contextModelUrls` separately from per-design assets
- Context model rendered semi-transparent (0.3 opacity) in R3F scene
- Context model sets reference coordinate transform; design models placed in same coordinate space
- Backward compatible: no context file = independent auto-fit (existing behavior)
- `AssetUrlsResponse` type added to `src/types/assets.ts`
- Fixed empty asset-urls response to return correct `{ assets, contextModelUrl, contextModelUrls }` shape

### Multi-Category 3D Models (2026-04-13)
- Support multiple GLB files per design via naming convention: `design_0_massing.glb`, `design_0_daylight.glb`, etc.
- New `parseAssetFilename()` in `file-ingestion.ts` extracts designKey + category from filename
- DB migration `002_add_asset_category.sql`: adds `category` column, updates unique constraint to `(design_id, asset_type, category)`
- `AssetEntry.modelUrl` → `AssetEntry.modelUrls` (`Record<string, string>` keyed by category)
- API routes updated to accept and return category-grouped model URLs
- Category switcher tabs in `ViewerToolbar` (visible when design has >1 category)
- `activeCategory` state added to Zustand `ViewSlice`, cleared on dataset reset
- 88+ file-ingestion tests for `parseAssetFilename`, 39 view-slice tests for category state

### Camera Lock on Design Switch (2026-04-13)
- Camera position, angle, and zoom now persist when switching between designs
- Only the first model load auto-fits; subsequent loads preserve camera state
- Reset camera button in toolbar still works as before
- 121 unit tests for camera lock behavior (`src/components/viewer/__tests__/camera-lock.test.ts`)

### Viewer Settings Profiles (2026-04-12)
- Updated default viewer settings: directional=2.0, exposure=3.0, grid=off
- Profile system: save, load, and delete named viewer settings snapshots
- Profiles persisted to localStorage (`design-explorer:viewer-profiles`)
- Collapsible "Profiles" section added to ViewerSettingsPanel with Select dropdown, save input, and delete button
- 12 unit tests for defaults, save/load/delete, and localStorage persistence
- ARCHITECTURE.md updated with ViewerSettingsSlice profiles and ParameterSettingsSlice docs

### Data Unload & Deletion Bug Fix (2026-04-12)
- Fixed: DropZone X button didn't visually unload data (React Query cache stayed `isSuccess: true`)
- Fixed: AssetDropZone X button didn't visually unload assets (same cache issue)
- Fixed: "Delete current dataset" didn't reset drop zones (stale cache entries persisted)
- Root cause: `removeQueries` now used to clear specific dataset/asset cache entries on unload/delete
- `useDeleteDataset` mutation `onSuccess` now removes dataset + asset URL cache entries
- 5 unit tests for cache cleanup logic

### Parameter Controls & Data Settings Hub (2026-04-06)
- New Zustand slice (`ParameterSettingsSlice`): per-parameter `isVisible`, `customMin`, `customMax`, `stepCount`
- DataSettingsMenu: gear-icon popover overlaid on chart panel (Settings2 from lucide)
  - Summary header: design count, input count, output count
  - Parameter rows grouped by role (Inputs/Outputs) with Switch toggle, min/max number inputs, step count input
  - "Reset all" button to clear overrides
- useChartOption: filters axes by visibility, applies custom bounds/splitNumber, re-indexes data arrays
- useChartEvents: aligned brush events with visible-only axis indices
- Cleared by `resetUIForNewDataset()` on dataset switch
- 8 unit tests for slice actions, defaults, and reset behavior

### Granular SSR Optimization (2026-04-06)
- Removed `ssr: false` dynamic import from app/(app)/page.tsx — ExplorerClient now SSR'd
- Next.js renders full app shell HTML on server (sidebar, layout, empty states) with Zustand defaults
- Only ECharts (ParallelCoordinates) and Three.js (ModelViewer) retain `ssr: false` dynamic imports
- Added `app/(app)/loading.tsx` — pure server component skeleton for streaming SSR
- ARCHITECTURE.md SSR section updated to reflect granular approach

### State Management Separation (2026-04-06)
- Server state migrated from Zustand to TanStack Query (React Query)
- Query hooks: useProjects, useDataset, useAssetUrls, usePreferences, useProjectDatasets
- Mutation hooks: useCreateProject, useDeleteProject, useDeleteDataset, useUploadDataset, useUploadAsset
- QueryProvider wraps app in ExplorerClient (5min stale, 30min GC, no window refocus)
- All 15+ components migrated from `useAppStore(s => s.rawData)` to `useDataset()` pattern
- Zustand slimmed to UI-only state: removed DataSlice, AssetSlice; slimmed ProjectSlice, FilterSlice
- Filtered designs now derived via `useMemo` from React Query data + Zustand brush ranges
- Added `resetUIForNewDataset()` action to clear brush ranges, selections, and color metric
- Deleted: useHydrate.ts, asset-slice.ts, data-slice.ts (all replaced by React Query)
- Store tests rewritten for new shape; filter-slice tests now test brush range management
- ARCHITECTURE.md updated: new State Management section, updated Data Flow, folder structure

### Secure File Uploads (2026-04-06)
- File validation utility (src/lib/file-validation.ts): extension whitelist, 50MB size limit, magic byte verification for PNG/JPEG/WebP/GLB/GLTF
- Upload API route hardened: validates extension, size, and content before design lookup or storage upload
- Client-side size check in AssetDropZone for immediate UX feedback before upload
- 31 unit tests for all validation functions and edge cases
- ARCHITECTURE.md updated with Upload Validation Pipeline section

### Test Infrastructure (2026-04-06)
- Vitest + React Testing Library + Playwright installed and configured
- Unit tests for `parseDesignData` (17 tests): flat/wrapped formats, auto-ID, column inference, sorting, error handling, real data.json validation
- Unit tests for `getColorHex` and `createColorScale` (8 tests): boundary values, clamping, grey fallback
- Zustand store tests for FilterSlice (5 tests): recomputeFilteredIds, brush range filtering (AND logic), clearFilters
- Zustand store tests for DataSlice (6 tests): setRawData, auto colorMetricKey, reset side effects, clearData
- Playwright smoke test for login page
- npm scripts: test, test:watch, test:coverage, test:e2e
- ARCHITECTURE.md updated with Testing section

### Phase 5 — Polish (2026-03-30)
- Loading skeleton: shows spinner + skeleton bars in chart/viewer area during hydration
- Signed URL expiration: useRefreshAssets hook auto-re-fetches asset URLs on image 403 errors
- ImageViewer and CatalogueView both trigger asset URL refresh on load failures
- Delete dataset UI: button in project section to delete current dataset with confirmation
- ProjectSelector refactored: extracted shared loadDataset helper, cleaner state management
- Build passes, TypeScript clean

### Phase 4 — Multi-User + Projects (2026-03-30)
- Project selector in sidebar: dropdown to switch projects, create new, delete existing
- Switching projects clears current data/assets and loads the new project's latest dataset + assets
- New project flow: inline name input with Enter or Create button
- Delete project: confirmation dialog, cascades to datasets/designs/assets
- User preferences API route (GET/PUT /api/preferences): persists theme and default project
- Theme persistence: toggling theme saves to server via user_preferences table
- Hydration loads preferences in parallel with projects, applies saved theme and default project
- API helpers added: fetchPreferences, updatePreferences, fetchProjectDatasets
- Build passes, TypeScript clean

### Phase 3 — Asset Storage (2026-03-30)
- API routes:
  - POST /api/assets/upload — multipart upload to Supabase Storage, upserts asset record
  - GET /api/assets/batch-urls — returns signed URLs for all assets in a dataset (1h expiry)
- AssetDropZone rewritten: uploads files to server with progress indicator instead of blob URLs
- file-ingestion.ts: `processAssetDrop`/`processFileInput` replaced with `collectAssetFiles` (returns raw File objects for server upload)
- AssetSlice updated: removed `revokeAllUrls`, added `mergeAssetMap`/`clearAssets` for server URL management
- useHydrate hook: now fetches asset URLs on mount via `fetchAssetUrls()`
- Client API helpers: added `uploadAsset()` and `fetchAssetUrls()` to src/lib/api.ts
- Supabase Storage RLS policies added: INSERT/UPDATE/SELECT/DELETE scoped to user's own folder
- Upload route: File converted to Buffer for Next.js compatibility, design key sanitized
- Build passes, TypeScript clean

### Phase 2 — Data Persistence + Real Auth (2026-03-30)
- Real Supabase Auth: login page with email/password sign-up and sign-in
- Auth middleware (middleware.ts): redirects unauthenticated users to /login
- Supabase middleware helper (src/lib/supabase/middleware.ts): cookie-based session management
- API routes:
  - POST/GET /api/projects — create and list user projects
  - DELETE /api/projects/[id] — delete project with cascade
  - POST /api/datasets — upload JSON, server-side parse, bulk insert designs
  - GET /api/datasets/[id] — fetch dataset metadata + all design rows
  - DELETE /api/datasets/[id] — delete dataset with cascade
  - GET /api/projects/[id]/datasets — list datasets for a project
- ProjectSlice added to Zustand store (currentProjectId, currentDatasetId, projects, isHydrating)
- DropZone modified: validates locally, then uploads to server API, auto-creates default project
- useHydrate hook: on mount, loads user's latest project and dataset from server
- Client-side API helpers (src/lib/api.ts): typed fetch wrappers for all routes
- .env.local wired with real Supabase URL + anon key

### Phase 1 — Next.js Shell + Placeholder Auth (2026-03-30)
- Branch `v2/nextjs-migration` created from `main`
- Vite removed: deleted vite.config.ts, index.html, main.tsx, tsconfig.node.json
- Next.js 15 App Router scaffolded with Tailwind v4 via @tailwindcss/postcss
- ExplorerClient.tsx: 'use client' wrapper replacing App.tsx + main.tsx
- App Router: root layout, (app) group layout, main page with dynamic import (ssr: false)
- Placeholder login page at /login with skip button (dev mode)
- Dynamic imports for ECharts (ParallelCoordinates) and Three.js (ModelViewer) — SSR-safe
- Supabase client stubs created (src/lib/supabase/client.ts, server.ts) with placeholder env vars
- ESLint config updated: removed react-refresh/vite plugin for Next.js compatibility
- useObjectUrl refactored from useState+useEffect to useMemo for React 19 strict mode
- shadcn components.json updated for RSC (rsc: true, removed resolvedPaths)
- Build passes, dev server runs, all existing UI renders identically to v1

### Phase 0 — Supabase Setup (2026-03-30)
- Supabase project created (iorfzztfqcbhbulqxmfg)
- SQL migration: 5 tables (projects, datasets, designs, assets, user_preferences)
- Row Level Security enabled on all tables with per-user policies
- Storage bucket `design-assets` created (private)
- Migration script saved to supabase/migrations/001_initial_schema.sql

---

## v1: Vite SPA

### Phase 8 — Design Selector & Catalogue View (2026-03-30)
- DesignSelector: searchable dropdown in sidebar, filters design IDs by substring, click to select
- CatalogueView: responsive thumbnail grid showing filtered designs' 2D images
- viewMode extended to '2d' | '3d' | 'catalogue' with LayoutGrid button in ViewerToolbar
- DesignSelector: X button to clear selection (deselect highlighted design in PCP)
- Thumbnail click selects design in catalogue (stays in catalogue view), hover updates DesignInfo
- Catalogue thumbnails: 3D button appears on hover (top-right) to jump directly to 3D viewer
- Color metric shown as thin color bar on each thumbnail card
- Selection highlight: selected design rendered as bright thick line (2nd ECharts series, z=2) with glow
- Catalogue highlights selected thumbnail with ring + auto-scrolls into view on external selection
- ARCHITECTURE.md updated with Phase 8 docs, component hierarchy, folder structure

### Phase 7 — Polish & Panel Swap (2026-03-30)
- Panel swap: toggle button (ArrowUpDown) in ViewerToolbar swaps viewer and chart positions
- panelsSwapped state in UISlice, MainContent renders panels in swapped order
- ErrorBoundary: wraps AppShell and viewer content, graceful fallback with retry button
- Keyboard shortcuts: Esc (clear selection), T (toggle theme), [ (toggle sidebar)
- Transparent chart background: prevents ECharts theme from painting over app background

### Phase 6 — Color Mapping & Controls (2026-03-29)
- MetricSelector: dropdown grouped by inputs (sky) / outputs (amber), sets colorMetricKey in store
- FilterSummary: shows active brush ranges as badges, filtered/total count, "Clear all" button
- DesignInfo: selected design parameter card with input/output sections, color dot on active metric
- Sidebar placeholders replaced with real controls
- Color sync: metric selector drives chart line colors + 3D model material color via shared useColorScale

### Phase 5 — 2D/3D Viewer (2026-03-29)
- ViewerPanel: orchestrates 2D/3D display based on viewMode + selected/hovered design ID
- ViewerToolbar: 2D/3D segmented toggle, displays selected design ID badge
- ImageViewer: renders image from assetMap blob URL, fade transition, skeleton loader, "no image" fallback
- ModelViewer: R3F Canvas with frameloop=demand, dpr=[1,2], antialias
- ModelScene: ambient + directional lights, OrbitControls, Environment preset=studio, Suspense with wireframe fallback
- DesignModel: useGLTF for GLB loading, auto-center/scale, applies color metric to mesh materials
- Color mapping: same blue-to-red scale from chart applied to 3D mesh material
- Hover preview: hoveredDesignId takes priority over selectedDesignId for live preview
- Empty states: context-aware messages (no data loaded vs no design selected)

### Phase 4 — Parallel Coordinates Chart (2026-03-29)
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

### Phase 3 — Data Ingestion (2026-03-29)
- DropZone: drag-drop or click for data.json, visual states (idle/hover/loaded/error), clear button
- AssetDropZone: drag-drop folder or click (webkitdirectory fallback), processes images + models
- DataSummary: shows design count, parameter count, numeric vs categorical breakdown
- data-slice updated: setRawData now initializes filteredIds, colorMetricKey, resets selection
- clearData revokes all asset URLs and resets full store
- file-ingestion.ts: auto-detect ID field, infer ColumnMeta (min/max), folder traversal
- SidebarContent wired with real DropZone + AssetDropZone replacing placeholders
- test-data/data.json: 20 sample designs with 6 numeric parameters

### Phase 2 — Layout Shell (2026-03-29)
- Sidebar: collapsible w-64 <-> w-12, icon-only collapsed state with tooltips
- SidebarHeader: Compass logo, app title, collapse toggle
- SidebarContent: organized sections (Data, Visualization, Selection) with placeholder slots
- Collapsed sidebar: icon buttons with tooltip hints for future features
- ThemeToggle: supports both full-width and icon-only modes
- MainContent: resizable split pane (viewer top / chart bottom) via drag handle
- ResizeHandle: custom draggable divider with min 120px per panel
- Empty states: polished icons + guidance text for viewer and chart areas

### Phase 1 — Scaffolding (2026-03-29)
- Vite 8 + React 19 + TypeScript + Tailwind v4 + shadcn/ui init
- 13 shadcn components added
- Zustand store: 6 slices (data, filter, selection, view, asset, ui)
- Types: DesignIteration, ColumnMeta, AssetEntry
- Lib: colors.ts (HSL interpolation), file-ingestion.ts (JSON + folder parser)
- Hooks: useTheme, useFilteredDesigns, useColorScale, useObjectUrl
- Basic layout shell with placeholder sidebar + main content
- GitHub repo created: olafolden/CC-DesignExplorer
