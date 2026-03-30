# Design Explorer -- Architecture & Implementation Guide

> A modern web application for exploring multi-objective design iteration data.
> Inspired by Thornton Tomasetti's "Design Explorer."

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Component Hierarchy](#component-hierarchy)
5. [Zustand Store Design](#zustand-store-design)
6. [Implementation Phases](#implementation-phases)
7. [Key Technical Decisions](#key-technical-decisions)
8. [shadcn/ui Components](#shadcnui-components)
9. [Data Flow](#data-flow)
10. [Color Mapping Strategy](#color-mapping-strategy)
11. [Performance Considerations](#performance-considerations)
12. [Verification Checklist](#verification-checklist)

---

## Overview

Design Explorer allows architects and engineers to:

- **Ingest** design iteration data (JSON) and corresponding 2D images / 3D models via drag-and-drop.
- **Visualize** all iterations on a Parallel Coordinates chart (ECharts).
- **Filter** designs interactively by brushing axes on the chart.
- **Inspect** a selected design in a 2D image viewer or 3D model viewer (React Three Fiber).
- **Color-map** both chart lines and 3D meshes by a user-chosen performance metric.

Target: Desktop/Monitor aspect ratios only (no mobile/tablet).

---

## Tech Stack

| Layer              | Technology                                      |
|--------------------|------------------------------------------------|
| Framework          | React 18+ (TypeScript) via Vite 6+             |
| Styling            | Tailwind CSS v4 (`@tailwindcss/vite` plugin)   |
| UI Components      | shadcn/ui (New York style, CSS variables)       |
| Icons              | Lucide React                                    |
| State Management   | Zustand 5+ (slice pattern, `devtools` middleware) |
| Charts             | Apache ECharts 5.5+ via `echarts-for-react`    |
| 3D Rendering       | React Three Fiber (`@react-three/fiber` + `@react-three/drei`) |
| 3D Engine          | Three.js 0.170+                                |

---

## Folder Structure

```
CC_DesignExlporer/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── components.json                        # shadcn/ui configuration
├── ARCHITECTURE.md                        # This file
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                           # ReactDOM entry point
│   ├── App.tsx                            # Root component, layout orchestrator
│   ├── index.css                          # Tailwind v4 entry (@import "tailwindcss")
│   │
│   ├── lib/
│   │   ├── utils.ts                       # shadcn cn() helper + general utilities
│   │   ├── colors.ts                      # HSL color interpolation (blue-to-red)
│   │   └── file-ingestion.ts              # JSON parse, folder traverse, asset map
│   │
│   ├── store/
│   │   ├── index.ts                       # Combined Zustand store (all slices)
│   │   ├── types.ts                       # All store type definitions
│   │   └── slices/
│   │       ├── data-slice.ts              # rawData, columns, metadata
│   │       ├── filter-slice.ts            # brushRanges, filteredIds (Set<string>)
│   │       ├── selection-slice.ts         # selectedDesignId, hoveredDesignId
│   │       ├── view-slice.ts              # viewMode (2d/3d), colorMetricKey
│   │       ├── asset-slice.ts             # assetMap (ID -> blob URLs)
│   │       └── ui-slice.ts               # theme, sidebarCollapsed
│   │
│   ├── hooks/
│   │   ├── useTheme.ts                    # Theme read/write + DOM class toggle
│   │   ├── useFilteredDesigns.ts          # Derived selector: filtered rows
│   │   ├── useColorScale.ts              # (value) -> hex color function
│   │   └── useObjectUrl.ts               # auto-revoke object URL lifecycle
│   │
│   ├── types/
│   │   ├── design.ts                      # DesignIteration, ColumnMeta interfaces
│   │   └── assets.ts                      # AssetEntry, AssetMap types
│   │
│   └── components/
│       ├── ui/                            # shadcn/ui auto-generated components
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   ├── select.tsx
│       │   ├── switch.tsx
│       │   ├── toggle.tsx
│       │   ├── tooltip.tsx
│       │   ├── scroll-area.tsx
│       │   ├── separator.tsx
│       │   ├── badge.tsx
│       │   ├── collapsible.tsx
│       │   ├── skeleton.tsx
│       │   ├── dropdown-menu.tsx
│       │   └── label.tsx
│       │
│       ├── layout/
│       │   ├── AppShell.tsx               # Top-level CSS Grid: sidebar + main
│       │   ├── Sidebar.tsx                # Collapsible sidebar container
│       │   ├── SidebarHeader.tsx          # Logo + collapse toggle
│       │   ├── SidebarContent.tsx         # Controls container
│       │   ├── MainContent.tsx            # Split: viewer (top) + chart (bottom)
│       │   └── ThemeToggle.tsx            # Light/dark mode switch
│       │
│       ├── ingestion/
│       │   ├── DropZone.tsx               # data.json drag-and-drop
│       │   ├── AssetDropZone.tsx          # Image/model folder drag-and-drop
│       │   └── DataSummary.tsx            # Loaded data stats
│       │
│       ├── chart/
│       │   ├── ParallelCoordinates.tsx    # ECharts wrapper component
│       │   ├── useChartOption.ts          # Hook: builds ECharts option from store
│       │   └── useChartEvents.ts          # Hook: brush/click events -> store
│       │
│       ├── viewer/
│       │   ├── ViewerPanel.tsx            # Orchestrator: 2D vs 3D switch
│       │   ├── ImageViewer.tsx            # 2D static image display
│       │   ├── ModelViewer.tsx            # R3F Canvas container
│       │   ├── ModelScene.tsx             # Lights, OrbitControls, Environment
│       │   ├── DesignModel.tsx            # GLB loader + color material override
│       │   ├── CatalogueView.tsx         # Thumbnail grid of filtered designs
│       │   └── ViewerToolbar.tsx          # 2D/3D/Catalogue toggle + controls
│       │
│       └── controls/
│           ├── MetricSelector.tsx         # Color metric dropdown
│           ├── DesignInfo.tsx             # Selected design parameter card
│           ├── DesignSelector.tsx         # Searchable design ID picker
│           └── FilterSummary.tsx          # Active brush ranges as chips
```

---

## Component Hierarchy

```
App
└── AppShell (CSS Grid)
    ├── Sidebar (collapsible: w-64 <-> w-14)
    │   ├── SidebarHeader
    │   │   ├── Logo / App Title
    │   │   └── Collapse Toggle (PanelLeftClose / PanelLeftOpen)
    │   └── SidebarContent (ScrollArea)
    │       ├── ThemeToggle (Sun/Moon + Switch)
    │       ├── DropZone (data.json)
    │       ├── AssetDropZone (images/models folder)
    │       ├── DataSummary (row count, column count, asset count)
    │       ├── MetricSelector (Select dropdown)
    │       ├── FilterSummary (Badge chips with X)
    │       ├── DesignSelector (Searchable design picker)
    │       └── DesignInfo (Card with key-value pairs)
    │
    └── MainContent (vertical flex)
        ├── ViewerPanel (~55% height)
        │   ├── ViewerToolbar (2D/3D/Catalogue toggle + panel swap)
        │   ├── ImageViewer (conditional: viewMode === '2d')
        │   │   └── <img> with fade transitions
        │   ├── ModelViewer (conditional: viewMode === '3d')
        │   │   └── <Canvas> (R3F)
        │   │       └── <Suspense>
        │   │           └── ModelScene
        │   │               ├── ambientLight + directionalLight
        │   │               ├── OrbitControls
        │   │               ├── Environment (preset="studio")
        │   │               └── DesignModel (useGLTF + color override)
        │   └── CatalogueView (conditional: viewMode === 'catalogue')
        │       └── ScrollArea > thumbnail grid (filtered designs)
        │
        └── ParallelCoordinates (~45% height)
            └── ReactECharts (parallel coordinates)
```

---

## Zustand Store Design

### Store Architecture

The store uses the **slice pattern** -- each domain concern is a separate slice creator function. All slices are combined into a single `useAppStore` hook with `devtools` middleware for debugging.

```typescript
// src/store/index.ts
const useAppStore = create<AppStore>()(
  devtools((...a) => ({
    ...createDataSlice(...a),
    ...createFilterSlice(...a),
    ...createSelectionSlice(...a),
    ...createViewSlice(...a),
    ...createAssetSlice(...a),
    ...createUISlice(...a),
  }))
);
```

### Slice Definitions

#### DataSlice
```typescript
interface DataSlice {
  rawData: DesignIteration[];        // Full dataset from JSON
  columns: ColumnMeta[];             // Auto-inferred column metadata
  isDataLoaded: boolean;
  setRawData(data, columns): void;
  clearData(): void;
}
```

#### FilterSlice
```typescript
interface BrushRange {
  axisIndex: number;                 // Which parallel axis
  key: string;                       // Column key
  range: [number, number];           // [min, max] selected
}

interface FilterSlice {
  brushRanges: BrushRange[];
  filteredIds: Set<string>;          // O(1) membership checks
  setBrushRanges(ranges): void;
  recomputeFilteredIds(): void;      // Cross-reads rawData via get()
  clearFilters(): void;
}
```

#### SelectionSlice
```typescript
interface SelectionSlice {
  selectedDesignId: string | null;   // Clicked design
  hoveredDesignId: string | null;    // Mouse-over design
  setSelectedDesignId(id): void;
  setHoveredDesignId(id): void;
}
```

#### ViewSlice
```typescript
interface ViewSlice {
  viewMode: '2d' | '3d' | 'catalogue';
  colorMetricKey: string | null;     // Column key for color mapping
  setViewMode(mode): void;
  setColorMetricKey(key): void;
}
```

#### AssetSlice
```typescript
interface AssetEntry {
  imageUrl: string | null;           // Blob URL for .png/.jpg
  modelUrl: string | null;           // Blob URL for .glb/.gltf
}

interface AssetSlice {
  assetMap: Record<string, AssetEntry>;
  isAssetsLoaded: boolean;
  setAssetMap(map): void;
  revokeAllUrls(): void;            // Memory cleanup
}
```

#### UISlice
```typescript
interface UISlice {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  setTheme(theme): void;
  toggleTheme(): void;
  setSidebarCollapsed(collapsed): void;
  toggleSidebar(): void;
}
```

### Selector Usage Rule

**Always use granular selectors** -- never subscribe to the entire store:

```typescript
// GOOD
const selectedId = useAppStore(s => s.selectedDesignId);

// BAD
const store = useAppStore();
```

---

## Implementation Phases

### Phase 1: Project Scaffolding (Current)

**Goal**: Vite + React + TS + Tailwind v4 + shadcn/ui running, all dependencies installed.

1. Initialize Vite: `npm create vite@latest . -- --template react-ts`
2. Install Tailwind v4: `npm i tailwindcss @tailwindcss/vite`
3. Configure `vite.config.ts` with `tailwindcss()` plugin before `react()`
4. Set `src/index.css` to `@import "tailwindcss"`
5. Initialize shadcn/ui: `npx shadcn@latest init`
6. Install all deps: `zustand echarts echarts-for-react @react-three/fiber @react-three/drei three @types/three`
7. Add shadcn components: button, card, select, switch, toggle, tooltip, scroll-area, separator, badge, collapsible, skeleton, dropdown-menu, label
8. Set up dark mode CSS variables
9. Verify: `npm run dev` shows page with Tailwind working

### Phase 2: Layout Shell

**Goal**: Sidebar + main content with theme toggle.

1. Build `AppShell` -- CSS Grid layout, sidebar + main columns
2. Build `Sidebar` -- collapsible with transition animation
3. Build `ThemeToggle` -- dark class toggle on `<html>`
4. Build `MainContent` -- vertical split with placeholder areas
5. Wire UISlice for theme + sidebar state

**Verify**: Sidebar collapses/expands, dark/light toggle works.

### Phase 3: Data Ingestion

**Goal**: Drag-drop data.json + asset folder into the app.

1. Build `DropZone` -- native HTML drag-drop, FileReader, JSON parse
2. Build `file-ingestion.ts` -- parse JSON, auto-detect ID field, infer ColumnMeta (type, min, max)
3. Build `AssetDropZone` -- `webkitGetAsEntry()` folder traversal, `createObjectURL()` per file
4. Build `DataSummary` -- display counts from store
5. Wire DataSlice + AssetSlice

**Verify**: Drop data.json -> summary shows "1000 designs, 8 parameters". Drop folder -> asset count updates.

### Phase 4: Parallel Coordinates Chart

**Goal**: Interactive chart with brush filtering.

1. Build `useChartOption` -- memoized ECharts option from store data
2. Build `useChartEvents` -- `axisareaselected` (debounced 50ms) -> store, click -> select
3. Build `ParallelCoordinates` -- ReactECharts with `notMerge`, `lazyUpdate`
4. Filtered lines at opacity 0.05, active at 0.6
5. Programmatic highlight on hover

**Verify**: Chart renders, brush dims lines, click selects a design.

### Phase 5: 2D/3D Viewer

**Goal**: Viewer responds to selection, toggles between image and 3D model.

1. Build `ViewerPanel` -- orchestrates based on viewMode + selectedDesignId
2. Build `ImageViewer` -- `<img>` from assetMap, fade transitions
3. Build `ModelViewer` -- R3F Canvas with `frameloop="demand"`
4. Build `ModelScene` -- lights, OrbitControls, Environment
5. Build `DesignModel` -- `useGLTF(blobUrl)`, material color override
6. Build `ViewerToolbar` -- 2D/3D toggle

**Verify**: Select design -> shows image or 3D model. Toggle works. Hover previews.

### Phase 6: Color Mapping & Cross-Component Sync

**Goal**: Single color metric drives chart + 3D viewer coloring.

1. Build `MetricSelector` -- dropdown from numeric columns
2. Build `useColorScale` -- HSL interpolation blue-to-red
3. Wire into chart option (line colors)
4. Wire into DesignModel (mesh material color)
5. Build `DesignInfo` -- selected design params card
6. Build `FilterSummary` -- active brush ranges as removable chips

**Verify**: Change metric -> chart + model recolor consistently.

### Phase 7: Polish & Performance

1. Transitions: sidebar, image crossfade, chart emphasis
2. Empty states with helpful prompts
3. Error handling: invalid JSON, missing assets, GLB load failure
4. Performance: selectors everywhere, `frameloop="demand"`, memoized options
5. Optional: resizable split pane, keyboard shortcuts

### Phase 8: Design Selector & Catalogue View

**Goal**: Browse filtered designs visually and select by name.

1. Build `DesignSelector` — searchable input + dropdown list in sidebar, filters design IDs by substring, X button to clear selection
2. Extend `viewMode` to `'2d' | '3d' | 'catalogue'`
3. Build `CatalogueView` — responsive thumbnail grid of filtered designs' 2D images
4. Add LayoutGrid button to ViewerToolbar segmented toggle
5. Thumbnail click -> `setSelectedDesignId(id)` (stays in catalogue view)
6. Thumbnail hover -> updates DesignInfo in sidebar
7. Color metric shown as thin color bar on each thumbnail
8. Thumbnail 3D button (top-right, visible on hover) -> selects design + switches to 3D viewer
9. Selection highlight: second ECharts series renders selected line with bright thick stroke + glow (z=2)
10. Catalogue auto-scrolls selected thumbnail into view on external selection (chart click, DesignSelector)

**Verify**: Search designs by name, browse catalogue, click thumbnail to select (stays in catalogue). Use 3D button on thumbnail to jump to 3D viewer. Clear selection via X button in DesignSelector. Selected design highlighted in chart and catalogue from any selection source.

---

## Key Technical Decisions

### Local File/Asset Handling

**Use `URL.createObjectURL()`** for all dropped files.

- Returns a lightweight blob URL string immediately (synchronous)
- Works natively with `<img src>`, Three.js `GLTFLoader`, and `useGLTF`
- Avoids converting large GLB files (10-50MB) into base64 data URLs (which would double memory)
- Lifecycle: store URLs in AssetSlice, call `URL.revokeObjectURL()` on reload/unmount

**Folder traversal**: `DataTransferItem.webkitGetAsEntry()` -> recursive `reader.readEntries()`. Fallback: `<input webkitdirectory>` button.

**Filename-to-ID mapping**: Filename stem (without extension) must match the design ID. E.g., `design_42.glb` -> ID `"design_42"`.

### ECharts Brush Event Handling

- Listen to `'axisareaselected'` via `onEvents` prop on ReactECharts
- **Debounce** the Zustand update with 50ms `requestAnimationFrame` to avoid excessive re-renders during drag
- On each event, extract active brush ranges from all axes and push to store
- Store calls `recomputeFilteredIds()` which produces `Set<string>` of matching IDs

### Brush -> Zustand -> Viewer Sync (Unidirectional)

```
User brushes axis
  -> axisareaselected event (debounced)
  -> store.setBrushRanges(ranges)
  -> store.recomputeFilteredIds()  [filters rawData, produces Set<string>]
  -> ParallelCoordinates subscribes to filteredIds -> rebuilds option with opacities
  -> ViewerPanel subscribes to selectedDesignId -> shows corresponding asset
```

### GLB Loading Strategy

- **Lazy**: Models load on-demand when a design is selected. No preloading.
- **Cached**: `useGLTF` from drei caches by URL internally. Reselecting is instant.
- **Suspense**: Wrap viewer in `<Suspense>` with skeleton fallback. Blob URL loads typically take 100-500ms.
- **Draco**: If Draco-compressed, `useGLTF` auto-loads the decoder from CDN.

---

## Color Mapping Strategy

### Interpolation: HSL Blue-to-Red

```typescript
function getColorHex(value: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Blue (hue=220) -> Red (hue=0)
  const hue = (1 - t) * 220;
  const saturation = 75;
  const lightness = 50;
  return hslToHex(hue, saturation, lightness);
}
```

**Why HSL**: ECharts and Three.js both need hex/rgb. HSL-to-hex is a 10-line function with zero dependencies. OKLCH would need a color space library for minimal perceptual benefit.

**Why blue-to-red**: Matches the Design Explorer convention. Distinguishable for deuteranopia (most common color vision deficiency).

### Usage Across Components

| Component             | How color is applied                                      |
|-----------------------|----------------------------------------------------------|
| ParallelCoordinates   | `lineStyle.color` per data row in ECharts option         |
| DesignModel (3D)      | `scene.traverse()` -> `mesh.material.color.set(hex)`    |
| DesignInfo card       | Colored Badge on the metric value                        |

---

## Performance Considerations

| Area        | Strategy                                                      |
|-------------|--------------------------------------------------------------|
| Zustand     | Granular selectors -- never subscribe to full store           |
| ECharts     | `notMerge={true}`, `lazyUpdate={true}`, `useMemo` on option  |
| Three.js    | `frameloop="demand"` (no idle 60fps), `dpr={[1,2]}`         |
| Assets      | `createObjectURL` (no base64), `revokeObjectURL` on cleanup  |
| Filtering   | `Set<string>` for O(1) membership, filter runs once in store |
| Re-renders  | Brush events debounced 50ms, chart option memoized           |
| GLB models  | Lazy load + useGLTF cache, no preloading of 1,000 models     |

---

## Verification Checklist

| Phase | Test                                                                  | Expected Result                                              |
|-------|-----------------------------------------------------------------------|--------------------------------------------------------------|
| 1     | `npm run dev`                                                         | Page loads, Tailwind classes work, shadcn Button renders     |
| 2     | Click sidebar collapse toggle                                         | Sidebar collapses/expands with transition                    |
| 2     | Click theme toggle                                                    | App switches between light and dark mode                     |
| 3     | Drag-drop `data.json` (10 rows)                                      | DataSummary shows row + column count                         |
| 3     | Drag-drop asset folder                                                | Asset count shown, no console errors                         |
| 4     | View parallel coordinates chart                                       | All design lines render                                      |
| 4     | Brush an axis                                                         | Non-matching lines dim to 0.05 opacity                       |
| 4     | Click a line                                                          | Design ID updates in store                                   |
| 5     | Click line -> check viewer                                            | Corresponding image or 3D model displays                     |
| 5     | Toggle 2D/3D                                                          | Viewer switches mode                                         |
| 6     | Change color metric dropdown                                          | Chart lines + 3D model recolor consistently                  |
| 6     | Verify filter summary chips                                           | Active ranges displayed, removable                           |
| 7     | Load 1,000 rows, brush rapidly                                        | Stays snappy (<100ms), no jank                               |
| 7     | Drop invalid JSON                                                     | Error message shown, no crash                                |
| 8     | Type in design selector                                                | List filters by substring match                              |
| 8     | Click catalogue (grid) button                                          | Thumbnail grid of filtered designs appears                   |
| 8     | Click a thumbnail                                                      | Switches to 2D view of that design                           |

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^5.0.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.115.0",
    "three": "^0.170.0",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.170.0",
    "typescript": "^5.6.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

---

## Lucide Icons Reference

| Icon              | Usage                          |
|-------------------|--------------------------------|
| PanelLeftClose    | Sidebar collapse (expanded)    |
| PanelLeftOpen     | Sidebar collapse (collapsed)   |
| Sun               | Light theme indicator          |
| Moon              | Dark theme indicator           |
| Upload            | Drop zone idle state           |
| FolderOpen        | Asset drop zone                |
| Image             | 2D view toggle                 |
| Box               | 3D view toggle                 |
| X                 | Clear filter chip              |
| ChevronDown       | Select dropdowns               |
| Info              | Tooltips                       |
| Check             | Data loaded confirmation       |
| Loader2           | Loading spinner (animate-spin) |
