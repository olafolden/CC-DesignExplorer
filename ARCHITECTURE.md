# Design Explorer v2 — Architecture & Implementation Guide

> A modern web application for exploring multi-objective design iteration data.
> Migrated from client-side Vite SPA to hosted Next.js web app with authentication, persistence, and multi-user support.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Component Hierarchy](#component-hierarchy)
5. [Zustand Store Design](#zustand-store-design)
6. [Database Schema](#database-schema)
7. [API Routes](#api-routes)
8. [Authentication Flow](#authentication-flow)
9. [Data Flow](#data-flow)
10. [SSR & Dynamic Imports](#ssr--dynamic-imports)
11. [Color Mapping Strategy](#color-mapping-strategy)
12. [Testing](#testing)
13. [Key Technical Decisions](#key-technical-decisions)
14. [Performance Considerations](#performance-considerations)
15. [Hosting & Deployment](#hosting--deployment)
16. [Verification Checklist](#verification-checklist)

---

## Overview

Design Explorer allows architects and engineers to:

- **Ingest** design iteration data (JSON) and corresponding 2D images / 3D models via drag-and-drop.
- **Visualize** all iterations on a Parallel Coordinates chart (ECharts).
- **Filter** designs interactively by brushing axes on the chart.
- **Inspect** a selected design in a 2D image viewer or 3D model viewer (React Three Fiber).
- **Color-map** both chart lines and 3D meshes by a user-chosen performance metric.
- **Persist** data server-side with authentication and multi-user support.

Target: Desktop/Monitor aspect ratios only (no mobile/tablet).

---

## Tech Stack

| Layer              | Technology                                          | Rationale                                                    |
|--------------------|-----------------------------------------------------|--------------------------------------------------------------|
| Framework          | Next.js 15 (App Router)                             | Standard for full-stack React. API routes built in           |
| Auth               | Supabase Auth                                       | Integrated with DB/storage. Email+password, OAuth. Free tier |
| Database           | Supabase Postgres                                   | Managed Postgres with Row Level Security (RLS)               |
| File Storage       | Supabase Storage                                    | S3-compatible, auth-aware, signed URLs                       |
| ORM/Client         | Supabase JS (`@supabase/supabase-js` + `@supabase/ssr`) | Typed queries, cookie-based auth for Next.js                |
| Hosting            | Vercel                                              | Zero-config Next.js deploys. Free tier for personal use      |
| Styling            | Tailwind CSS v4 (`@tailwindcss/postcss`)            | PostCSS plugin replaces Vite plugin                          |
| UI Components      | shadcn/ui (New York style, CSS variables)           | Framework-agnostic, copies directly                          |
| Icons              | Lucide React                                        |                                                              |
| State Management   | Zustand 5+ (slice pattern, `devtools` middleware)   | Client-side cache, hydrated from server                      |
| Charts             | Apache ECharts via `echarts-for-react`              | Dynamic import with `ssr: false`                             |
| 3D Rendering       | React Three Fiber + drei                            | Dynamic import with `ssr: false`                             |
| 3D Engine          | Three.js 0.183+                                     |                                                              |

**Why Supabase**: One SDK gives auth + database + file storage + RLS. Avoids stitching together NextAuth + Prisma + S3 + IAM policies. Underneath it's standard Postgres and S3 — low lock-in, easy to migrate away.

**Cost at small scale (1-10 users)**: $0 (Supabase free tier + Vercel free tier)

---

## Folder Structure

```
CC_DesignExplorer/
├── next.config.ts                         # Next.js configuration
├── middleware.ts                          # Auth middleware (session check + redirect)
├── package.json
├── tsconfig.json
├── components.json                        # shadcn/ui configuration
├── ARCHITECTURE.md                        # This file
├── public/
│   └── favicon.svg
├── app/
│   ├── layout.tsx                         # Root layout (html, body, metadata)
│   ├── login/
│   │   └── page.tsx                       # Login page (server-rendered)
│   ├── (app)/
│   │   ├── layout.tsx                     # Auth-protected layout (checks session)
│   │   └── page.tsx                       # Main page → renders ExplorerClient
│   └── api/
│       ├── projects/
│       │   ├── route.ts                   # GET (list) + POST (create)
│       │   └── [id]/
│       │       ├── route.ts              # GET + DELETE (cascade)
│       │       └── datasets/route.ts     # GET datasets for project
│       ├── datasets/
│       │   ├── route.ts                   # POST (upload JSON + parse + insert)
│       │   └── [id]/
│       │       └── route.ts              # GET (metadata + designs) + DELETE
│       ├── assets/
│       │   ├── upload/
│       │   │   └── route.ts              # POST (multipart → Supabase Storage)
│       │   ├── file/
│       │   │   └── route.ts              # GET (single file from storage)
│       │   └── batch-urls/
│       │       └── route.ts              # GET (signed URLs for multiple assets)
│       └── preferences/
│           └── route.ts                   # GET + PUT (user preferences)
├── src/
│   ├── index.css                          # Tailwind v4 entry
│   │
│   ├── lib/
│   │   ├── utils.ts                       # cn() helper
│   │   ├── colors.ts                      # HSL color interpolation
│   │   ├── file-ingestion.ts              # JSON parse, folder traverse, asset collection
│   │   ├── api.ts                         # Client-side API helpers (fetch wrappers)
│   │   └── supabase/
│   │       ├── client.ts                  # Browser Supabase client
│   │       ├── server.ts                  # Server Supabase client (cookies)
│   │       └── middleware.ts              # Supabase auth middleware helper
│   │
│   ├── store/
│   │   ├── index.ts                       # Combined Zustand store
│   │   ├── types.ts                       # All store type definitions
│   │   └── slices/
│   │       ├── data-slice.ts              # rawData, columns, metadata
│   │       ├── filter-slice.ts            # brushRanges, filteredIds (Set<string>)
│   │       ├── selection-slice.ts         # selectedDesignId, hoveredDesignId
│   │       ├── view-slice.ts              # viewMode (2d/3d/catalogue), colorMetricKey
│   │       ├── asset-slice.ts             # assetMap (ID -> server signed URLs)
│   │       ├── ui-slice.ts               # theme, sidebarCollapsed, panelsSwapped
│   │       ├── project-slice.ts           # currentProjectId, currentDatasetId
│   │       └── viewer-settings-slice.ts   # 3D viewer rendering controls
│   │
│   ├── hooks/
│   │   ├── useHydrate.ts                  # Load projects, datasets, assets on mount
│   │   ├── useTheme.ts                    # Theme read/write + DOM class toggle
│   │   ├── useFilteredDesigns.ts          # Derived selector: filtered rows
│   │   ├── useColorScale.ts              # (value) -> hex color function
│   │   ├── useObjectUrl.ts               # auto-revoke object URL lifecycle
│   │   └── useRefreshAssets.ts            # Re-fetch signed URLs on 403
│   │
│   ├── types/
│   │   ├── design.ts                      # DesignIteration, ColumnMeta interfaces
│   │   └── assets.ts                      # AssetEntry, AssetMap types
│   │
│   └── components/
│       ├── ExplorerClient.tsx             # 'use client' wrapper for AppShell
│       ├── ErrorBoundary.tsx              # Error fallback with retry
│       ├── ui/                            # shadcn/ui auto-generated components
│       ├── layout/
│       │   ├── AppShell.tsx               # Top-level flex layout: sidebar + main
│       │   ├── Sidebar.tsx                # Collapsible sidebar container
│       │   ├── SidebarHeader.tsx          # Logo + collapse toggle
│       │   ├── SidebarContent.tsx         # Controls container
│       │   ├── MainContent.tsx            # Split: viewer (top) + chart (bottom)
│       │   ├── ResizeHandle.tsx           # Draggable split divider
│       │   └── ThemeToggle.tsx            # Light/dark mode switch
│       ├── ingestion/
│       │   ├── DropZone.tsx               # data.json drag-drop → server upload
│       │   ├── AssetDropZone.tsx          # Asset folder drag-drop → server upload
│       │   └── DataSummary.tsx            # Loaded data stats
│       ├── chart/
│       │   ├── ParallelCoordinates.tsx    # ECharts wrapper (dynamic import)
│       │   ├── useChartOption.ts          # Hook: builds ECharts option from store
│       │   └── useChartEvents.ts          # Hook: brush/click events -> store
│       ├── viewer/
│       │   ├── ViewerPanel.tsx            # Orchestrator: 2D/3D/catalogue switch
│       │   ├── ImageViewer.tsx            # 2D image display (server URLs)
│       │   ├── ModelViewer.tsx            # R3F Canvas container (dynamic import)
│       │   ├── ModelScene.tsx             # Lights, OrbitControls, Environment
│       │   ├── DesignModel.tsx            # GLB loader + color material override
│       │   ├── CatalogueView.tsx          # Thumbnail grid of filtered designs
│       │   ├── ViewerToolbar.tsx          # 2D/3D/Catalogue toggle + controls
│       │   └── ViewerSettingsPanel.tsx    # 3D lighting/rendering controls
│       └── controls/
│           ├── ProjectSelector.tsx         # Project dropdown + create/delete
│           ├── MetricSelector.tsx         # Color metric dropdown
│           ├── DesignInfo.tsx             # Selected design parameter card
│           ├── DesignSelector.tsx         # Searchable design ID picker
│           └── FilterSummary.tsx          # Active brush ranges as chips
```

---

## Component Hierarchy

```
ExplorerClient ('use client', hydration, keyboard shortcuts)
└── AppShell (flex layout)
    ├── Sidebar (collapsible: w-64 <-> w-12)
    │   ├── SidebarHeader
    │   │   ├── Logo / App Title
    │   │   └── Collapse Toggle (PanelLeftClose / PanelLeftOpen)
    │   └── SidebarContent (ScrollArea)
    │       ├── ThemeToggle (Sun/Moon + Switch)
    │       ├── ProjectSelector (project dropdown + create/delete)
    │       ├── DropZone (data.json → server upload)
    │       ├── AssetDropZone (images/models folder → server upload)
    │       ├── DataSummary (row count, column count, asset count)
    │       ├── MetricSelector (Select dropdown)
    │       ├── FilterSummary (Badge chips with X)
    │       ├── DesignSelector (Searchable design picker)
    │       └── DesignInfo (Card with key-value pairs)
    │
    └── MainContent (vertical flex, resizable split)
        ├── ViewerPanel (~55% height)
        │   ├── ViewerToolbar (2D/3D/Catalogue toggle + panel swap + settings)
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
        │   ├── CatalogueView (conditional: viewMode === 'catalogue')
        │   │   └── ScrollArea > thumbnail grid (filtered designs)
        │   └── ViewerSettingsPanel (conditional: 3D settings open)
        │
        └── ParallelCoordinates (~45% height)
            └── ReactECharts (parallel coordinates)
```

---

## Zustand Store Design

### Store Architecture

The store uses the **slice pattern** — each domain concern is a separate slice creator function. All slices are combined into a single `useAppStore` hook with `devtools` middleware for debugging.

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
    ...createProjectSlice(...a),
    ...createViewerSettingsSlice(...a),
  }))
);
```

### Slice Definitions

#### DataSlice
```typescript
interface DataSlice {
  rawData: DesignIteration[];        // Full dataset from server
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
  imageUrl: string | null;           // Signed URL for .png/.jpg
  modelUrl: string | null;           // Signed URL for .glb/.gltf
}

interface AssetSlice {
  assetMap: Record<string, AssetEntry>;
  isAssetsLoaded: boolean;
  setAssetMap(map): void;
  mergeAssetMap(partial): void;
  clearAssets(): void;
}
```

#### UISlice
```typescript
interface UISlice {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  panelsSwapped: boolean;
  setTheme(theme): void;
  toggleTheme(): void;
  setSidebarCollapsed(collapsed): void;
  toggleSidebar(): void;
  togglePanelSwap(): void;
}
```

#### ProjectSlice
```typescript
interface ProjectSlice {
  currentProjectId: string | null;
  currentDatasetId: string | null;
  projects: ProjectInfo[];
  isHydrating: boolean;
  setCurrentProjectId(id): void;
  setCurrentDatasetId(id): void;
  setProjects(projects): void;
  setIsHydrating(v): void;
}
```

#### ViewerSettingsSlice
```typescript
interface ViewerSettingsSlice {
  viewerSettings: ViewerSettings;    // backgroundColor, lighting, FOV, wireframe, etc.
  setViewerSettings(partial): void;
  resetViewerSettings(): void;
}
```

### Selector Usage Rule

**Always use granular selectors** — never subscribe to the entire store:

```typescript
// GOOD
const selectedId = useAppStore(s => s.selectedDesignId);

// BAD
const store = useAppStore();
```

---

## Database Schema

Five tables. RLS policies on every table filter by `user_id = auth.uid()`.

### projects
| Column       | Type          | Notes                    |
|-------------|---------------|--------------------------|
| id          | uuid PK       | Default `gen_random_uuid()` |
| user_id     | uuid FK       | → auth.users, indexed    |
| name        | text          | Project display name     |
| created_at  | timestamptz   | Default `now()`          |
| updated_at  | timestamptz   | Default `now()`          |

### datasets
| Column       | Type          | Notes                                      |
|-------------|---------------|--------------------------------------------|
| id          | uuid PK       | Default `gen_random_uuid()`                 |
| project_id  | uuid FK       | → projects, indexed                         |
| user_id     | uuid FK       | → auth.users, indexed (for RLS)             |
| name        | text          | Original filename (e.g., "data.json")       |
| columns_meta| jsonb         | ColumnMeta[] array (roles, min/max)         |
| row_count   | integer       |                                              |
| created_at  | timestamptz   | Default `now()`                             |

### designs
| Column       | Type          | Notes                                       |
|-------------|---------------|---------------------------------------------|
| id          | uuid PK       | Default `gen_random_uuid()`                  |
| dataset_id  | uuid FK       | → datasets, indexed                          |
| user_id     | uuid FK       | → auth.users, indexed (for RLS)              |
| design_key  | text          | Original design ID (e.g., "design_0")        |
| params      | jsonb         | Full key-value row: {floor_area: 2400, ...}  |
|             |               | UNIQUE(dataset_id, design_key)               |

### assets
| Column            | Type          | Notes                                 |
|------------------|---------------|---------------------------------------|
| id               | uuid PK       | Default `gen_random_uuid()`            |
| design_id        | uuid FK       | → designs, indexed                     |
| user_id          | uuid FK       | → auth.users, indexed (for RLS)        |
| asset_type       | text          | `'image'` or `'model'`                 |
| storage_path     | text          | Path in Supabase Storage bucket        |
| original_filename| text          |                                         |
| mime_type        | text          |                                         |
| size_bytes       | bigint        |                                         |
| created_at       | timestamptz   | Default `now()`                        |
|                  |               | UNIQUE(design_id, asset_type)          |

### user_preferences
| Column             | Type          | Notes                        |
|-------------------|---------------|------------------------------|
| user_id           | uuid PK FK    | → auth.users                  |
| theme             | text          | `'light'` or `'dark'`         |
| default_project_id| uuid FK null  | → projects                    |
| updated_at        | timestamptz   | Default `now()`               |

### Design Decisions
- `designs.params` is JSONB because each dataset has different parameters (4-20+ columns)
- `columns_meta` on datasets stores the ColumnMeta[] array — static schema metadata
- `assets.storage_path` references files in Supabase Storage; actual URLs generated via signed URL at read time
- Every table carries `user_id` for RLS simplicity (denormalized but makes policies trivial)

---

## API Routes

| Method   | Route                         | Purpose                                      |
|----------|-------------------------------|----------------------------------------------|
| `POST`   | `/api/projects`               | Create a new project                         |
| `GET`    | `/api/projects`               | List user's projects                         |
| `GET`    | `/api/projects/[id]`          | Get single project                           |
| `DELETE` | `/api/projects/[id]`          | Delete project + cascade datasets/assets     |
| `GET`    | `/api/projects/[id]/datasets` | List datasets for a project                  |
| `POST`   | `/api/datasets`               | Upload JSON data, parse server-side, insert designs |
| `GET`    | `/api/datasets/[id]`          | Get dataset metadata + all design rows       |
| `DELETE` | `/api/datasets/[id]`          | Delete dataset + designs + assets            |
| `POST`   | `/api/assets/upload`          | Multipart upload → Supabase Storage          |
| `GET`    | `/api/assets/file`            | Get single file from storage                 |
| `GET`    | `/api/assets/batch-urls`      | Returns signed URLs for multiple assets      |
| `GET`    | `/api/preferences`            | Get user preferences                         |
| `PUT`    | `/api/preferences`            | Update user preferences (theme, default project) |

Every route handler starts with `const { data: { user } } = await supabase.auth.getUser()` and returns 401 if null. RLS acts as a safety net even if a handler has a bug.

---

## Authentication Flow

```
User visits URL
    ↓
middleware.ts checks Supabase session cookie
    ↓
┌─ No session ──→ Redirect to /login
│                     ↓
│                 LoginForm (email/password or OAuth)
│                     ↓
│                 Supabase Auth sets session cookie
│                     ↓
│                 Redirect to /(app)
│
└─ Valid session ──→ Render /(app)/page.tsx
                         ↓
                     ExplorerClient ('use client')
                         ↓
                     Load current project/dataset from API
                         ↓
                     Hydrate Zustand store
                         ↓
                     Explorer UI renders
```

### Implementation Details
- `@supabase/ssr` handles cookie-based session management
- `middleware.ts` intercepts all requests: unauthenticated users → `/login`, authenticated on `/login` → `/(app)`
- Server components use `createServerClient()` from `@supabase/ssr`
- Client components use `createBrowserClient()` from `@supabase/ssr`
- Session stored in HTTP-only cookies (secure, same-site)

---

## Data Flow

### File Ingestion

```
Drop JSON → read file → POST /api/datasets (raw JSON)
    ↓ server
parseDesignData() → validate → INSERT dataset + bulk INSERT designs
    ↓ response
Return dataset ID + columns metadata
    ↓ client
Zustand store hydrated with server response
```

### Asset Handling

```
Drop folder → traverse entries → POST /api/assets/upload (multipart, parallel batches)
    ↓ server
Store in Supabase Storage at {user_id}/{dataset_id}/{design_key}.{ext}
    ↓ client
On design select → GET /api/assets/batch-urls → signed URLs in AssetSlice
```

- Large GLBs (10-50MB) use Supabase Storage direct-upload (signed upload URL bypasses Vercel's 4.5MB limit)
- Filename stem must match design ID for asset-design pairing

### On Page Load (Returning User)

```
ExplorerClient mounts
    ↓
GET /api/projects → populate ProjectSlice
    ↓
GET /api/datasets/[currentDatasetId] → setRawData() in DataSlice
    ↓
GET /api/assets/batch-urls → setAssetMap() in AssetSlice
    ↓
Explorer UI renders with persisted data
```

### Brush -> Zustand -> Viewer Sync (Unidirectional)

```
User brushes axis
  -> axisareaselected event (debounced 50ms via rAF)
  -> store.setBrushRanges(ranges)
  -> store.recomputeFilteredIds()  [filters rawData, produces Set<string>]
  -> ParallelCoordinates subscribes to filteredIds -> rebuilds option with opacities
  -> ViewerPanel subscribes to selectedDesignId -> shows corresponding asset
```

---

## SSR & Dynamic Imports

The explorer is a `'use client'` application. Next.js provides the routing shell, auth middleware, and API routes only.

| Component / Area          | SSR? | Strategy                                        |
|--------------------------|------|-------------------------------------------------|
| `ExplorerClient`          | No   | `dynamic(() => import(...), { ssr: false })`    |
| `ParallelCoordinates`     | No   | `dynamic()` — ECharts accesses `window`          |
| `ModelViewer`             | No   | `dynamic()` — Three.js/WebGL requires browser   |
| `AppShell`, `Sidebar`     | No   | Inside `'use client'` tree (Zustand-dependent)  |
| `ImageViewer`             | No   | Inside `'use client'` tree                       |
| `Login page`              | Yes  | Server-rendered simple form                      |
| `(app)/layout.tsx`        | Yes  | Checks auth, renders `{children}`               |
| API route handlers        | N/A  | Server only                                      |

### Main Page Pattern
```typescript
// app/(app)/page.tsx (server component — thin wrapper)
import dynamic from 'next/dynamic'
const ExplorerClient = dynamic(() => import('@/components/ExplorerClient'), { ssr: false })
export default function Page() { return <ExplorerClient /> }
```

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

## Testing

### Stack

| Tool | Purpose | Config |
|------|---------|--------|
| Vitest | Unit & integration tests | `vitest.config.ts` — node env by default, jsdom for component tests |
| React Testing Library | Component rendering tests | `vitest.setup.ts` — jest-dom matchers |
| Playwright | E2E browser tests | `playwright.config.ts` — chromium, localhost:3000 |

### Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all unit/integration tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |

### Test Organization

- `src/lib/__tests__/` — pure utility tests (file-ingestion, colors)
- `src/store/__tests__/` — Zustand store slice tests
- `e2e/` — Playwright end-to-end tests

### Conventions

- **TDD**: Write failing tests before implementation
- **Store tests**: Use the real `useAppStore` (not mocked) — call `useAppStore.getState()` and `useAppStore.setState()` directly
- **Environment**: Use `node` for pure logic tests, `jsdom` only when testing DOM/React components (via `*.component.test.tsx` naming or `@vitest-environment jsdom` comment)

---

## Key Technical Decisions

### Local File/Asset Handling

**Filename-to-ID mapping**: Filename stem (without extension) must match the design ID. E.g., `design_42.glb` → ID `"design_42"`.

### Upload Validation Pipeline

All file uploads go through `POST /api/assets/upload` with a three-stage server-side validation (`src/lib/file-validation.ts`):

1. **Extension whitelist**: Only `.png`, `.jpg`, `.jpeg`, `.webp`, `.glb`, `.gltf` accepted
2. **Size limit**: 50 MB max (`MAX_FILE_SIZE_BYTES`). Client-side pre-check in AssetDropZone for fast UX feedback
3. **Magic byte verification**: Validates file content matches declared extension
   - PNG: `89 50 4E 47` header
   - JPEG: `FF D8 FF` header
   - WebP: `RIFF` + `WEBP` at bytes 8-11
   - GLB: `glTF` magic bytes
   - GLTF: Valid JSON with `asset` field

Validation runs before the design lookup and storage upload, rejecting invalid files early.

### ECharts Brush Event Handling

- Listen to `'axisareaselected'` via `onEvents` prop on ReactECharts
- **Debounce** the Zustand update with 50ms `requestAnimationFrame` to avoid excessive re-renders during drag
- On each event, extract active brush ranges from all axes and push to store
- Store calls `recomputeFilteredIds()` which produces `Set<string>` of matching IDs

### GLB Loading Strategy

- **Lazy**: Models load on-demand when a design is selected. No preloading.
- **Cached**: `useGLTF` from drei caches by URL internally. Reselecting is instant.
- **Suspense**: Wrap viewer in `<Suspense>` with skeleton fallback.
- **Draco**: If Draco-compressed, `useGLTF` auto-loads the decoder from CDN.

---

## Performance Considerations

| Area        | Strategy                                                      |
|-------------|--------------------------------------------------------------|
| Zustand     | Granular selectors — never subscribe to full store           |
| ECharts     | `notMerge={true}`, `lazyUpdate={true}`, `useMemo` on option  |
| Three.js    | `frameloop="demand"` (no idle 60fps), `dpr={[1,2]}`         |
| Assets      | Signed URLs from server; blob URLs via `useObjectUrl` hook    |
| Filtering   | `Set<string>` for O(1) membership, filter runs once in store |
| Re-renders  | Brush events debounced 50ms, chart option memoized           |
| GLB models  | Lazy load + useGLTF cache, no preloading of 1,000 models     |

---

## Hosting & Deployment

| Concern              | Details                                                             |
|---------------------|---------------------------------------------------------------------|
| **Hosting**          | Vercel free tier (personal) or Pro (team)                           |
| **Env variables**    | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only) |
| **File size limits** | Vercel serverless: 4.5MB body limit. Large assets use Supabase direct-upload |
| **Build**            | `next build` — ECharts/Three.js code-split via dynamic imports      |
| **CDN**              | Vercel edge network for static assets; Supabase Storage CDN for uploads |
| **Region**           | Same region for Supabase and Vercel (e.g., `us-east-1`)            |
| **Custom domain**    | Configure in Vercel dashboard                                        |
| **Self-hosted alt**  | Docker (`next start`) behind Nginx/Caddy on any VPS                 |

---

## Verification Checklist

| Phase | Test                                                     | Expected Result                                      |
|-------|----------------------------------------------------------|------------------------------------------------------|
| Auth  | Visit app URL without login                              | Redirected to /login                                  |
| Auth  | Login with email/password                                | Redirected to app, explorer UI renders                |
| UI    | Click sidebar collapse toggle                            | Sidebar collapses/expands with transition             |
| UI    | Click theme toggle                                       | App switches between light and dark mode              |
| Data  | Drop data.json                                           | Data uploaded, summary shows counts                   |
| Data  | Refresh page                                             | Data still loaded from server                         |
| Chart | View parallel coordinates chart                          | All design lines render                               |
| Chart | Brush an axis                                            | Non-matching lines dim to 0.05 opacity                |
| Chart | Click a line                                             | Design ID updates in store                            |
| View  | Click line → check viewer                                | Corresponding image or 3D model displays              |
| View  | Toggle 2D/3D/Catalogue                                   | Viewer switches mode                                  |
| Color | Change color metric dropdown                             | Chart lines + 3D model recolor consistently           |
| Asset | Drop asset folder                                        | Upload progress shown, assets stored                  |
| Asset | Refresh page, select design                              | Image/model loads from server URLs                    |
| Multi | Create second user, login                                | Cannot see first user's data                          |
| Multi | Switch between projects                                  | Correct dataset loads for each project                |
| Perf  | Load 100+ designs with GLBs                              | Handles large datasets without timeout                |
| Perf  | Load 1,000 rows, brush rapidly                           | Stays snappy (<100ms), no jank                        |
| Error | Drop invalid JSON                                        | Error message shown, no crash                         |
| Error | Network error during upload                              | Error message shown, no crash                         |
