# Design Explorer v2 — Full-Stack Architecture & Migration Guide

> Migration from client-side Vite SPA to hosted Next.js web app with authentication, persistence, and multi-user support.

---

## Table of Contents

1. [Context](#context)
2. [Scope of Change](#scope-of-change)
3. [Tech Stack](#tech-stack)
4. [Folder Structure](#folder-structure)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Authentication Flow](#authentication-flow)
8. [Data Flow Changes](#data-flow-changes)
9. [SSR & Dynamic Imports](#ssr--dynamic-imports)
10. [Zustand Store Changes](#zustand-store-changes)
11. [Implementation Phases](#implementation-phases)
12. [Critical Files Affected](#critical-files-affected)
13. [Hosting & Deployment](#hosting--deployment)
14. [Verification Checklist](#verification-checklist)

---

## Context

The Design Explorer v1 is a pure client-side Vite+React SPA. All data lives in browser memory (Zustand + blob URLs) and disappears on refresh. v2 makes it a hosted web app where users log in, upload data, and find it still there when they come back.

---

## Scope of Change

### What's New
1. **Next.js App Router** — replaces Vite as the framework (routing, SSR shell, API routes)
2. **Authentication** — login/signup, sessions, protected routes
3. **Database** — store user data, design parameters, column metadata, project info
4. **File storage** — images and GLB models persisted on server, not in browser memory
5. **API routes** — server endpoints for uploading data, fetching designs, managing assets
6. **Multi-tenancy** — each user sees only their own data

### What Stays the Same
- All existing React components copy over unchanged
- Zustand store architecture (slice pattern, granular selectors)
- shadcn/ui components, Tailwind CSS v4 styling
- ECharts parallel coordinates chart
- React Three Fiber 3D viewer
- All hooks (`useFilteredDesigns`, `useColorScale`, etc.)

### What's NOT Needed
- Heavy SSR — the explorer stays `'use client'`. Next.js is just the auth shell + API layer
- A custom backend server — Next.js API routes handle everything
- Major component rewrites

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
| UI Components      | shadcn/ui (unchanged)                               | Framework-agnostic, copies directly                          |
| State Management   | Zustand 5+ (unchanged)                              | Client-side cache, hydrated from server                      |
| Charts             | Apache ECharts via `echarts-for-react` (unchanged)  | Dynamic import with `ssr: false`                             |
| 3D Rendering       | React Three Fiber + drei (unchanged)                | Dynamic import with `ssr: false`                             |

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
├── architecture-2.md                      # This file
├── public/
│   └── favicon.svg
├── app/
│   ├── layout.tsx                         # Root layout (html, body, metadata)
│   ├── login/
│   │   └── page.tsx                       # Login page (server-rendered)
│   ├── signup/
│   │   └── page.tsx                       # Signup page (server-rendered)
│   ├── (app)/
│   │   ├── layout.tsx                     # Auth-protected layout (checks session)
│   │   └── page.tsx                       # Main page → renders ExplorerClient
│   └── api/
│       ├── projects/
│       │   ├── route.ts                   # GET (list) + POST (create)
│       │   └── [id]/
│       │       └── route.ts              # DELETE (cascade)
│       ├── datasets/
│       │   ├── route.ts                   # POST (upload JSON + parse + insert)
│       │   └── [id]/
│       │       └── route.ts              # GET (metadata + designs) + DELETE
│       ├── assets/
│       │   ├── upload/
│       │   │   └── route.ts              # POST (multipart → Supabase Storage)
│       │   └── batch-urls/
│       │       └── route.ts              # GET (signed URLs for multiple assets)
│       └── preferences/
│           └── route.ts                   # PUT (update user preferences)
├── src/
│   ├── index.css                          # Tailwind v4 entry
│   │
│   ├── lib/
│   │   ├── utils.ts                       # cn() helper
│   │   ├── colors.ts                      # HSL color interpolation
│   │   ├── file-ingestion.ts              # Client-side: drag-drop handling only
│   │   ├── file-ingestion.server.ts       # Server-side: JSON parse + DB insert
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser Supabase client
│   │   │   ├── server.ts                  # Server Supabase client (cookies)
│   │   │   └── middleware.ts              # Supabase auth middleware helper
│   │   └── api.ts                         # Client-side API helpers (fetch wrappers)
│   │
│   ├── store/
│   │   ├── index.ts                       # Combined Zustand store
│   │   ├── types.ts                       # All store type definitions
│   │   └── slices/
│   │       ├── data-slice.ts              # rawData + hydration from server
│   │       ├── filter-slice.ts            # brushRanges, filteredIds (unchanged)
│   │       ├── selection-slice.ts         # selectedDesignId (unchanged)
│   │       ├── view-slice.ts              # viewMode, colorMetricKey (unchanged)
│   │       ├── asset-slice.ts             # Server URLs instead of blob URLs
│   │       ├── ui-slice.ts               # theme, sidebar (unchanged)
│   │       └── project-slice.ts           # NEW: currentProjectId, currentDatasetId
│   │
│   ├── hooks/                             # All existing hooks unchanged
│   │   ├── useTheme.ts
│   │   ├── useFilteredDesigns.ts
│   │   ├── useColorScale.ts
│   │   └── useObjectUrl.ts
│   │
│   ├── types/                             # Existing types + Supabase generated types
│   │   ├── design.ts
│   │   ├── assets.ts
│   │   └── database.ts                   # Generated: supabase gen types typescript
│   │
│   └── components/
│       ├── ExplorerClient.tsx             # NEW: 'use client' wrapper for AppShell
│       ├── ui/                            # shadcn/ui (unchanged)
│       ├── layout/                        # AppShell, Sidebar, etc. (unchanged)
│       ├── ingestion/
│       │   ├── DropZone.tsx               # Modified: uploads to server API
│       │   ├── AssetDropZone.tsx          # Modified: uploads to Supabase Storage
│       │   └── DataSummary.tsx            # Unchanged
│       ├── chart/
│       │   ├── ParallelCoordinates.tsx    # Wrapped in dynamic() import
│       │   ├── useChartOption.ts          # Unchanged
│       │   └── useChartEvents.ts          # Unchanged
│       ├── viewer/
│       │   ├── ViewerPanel.tsx            # Unchanged
│       │   ├── ImageViewer.tsx            # Uses server URLs instead of blob URLs
│       │   ├── ModelViewer.tsx            # Wrapped in dynamic() import
│       │   ├── ModelScene.tsx             # Unchanged
│       │   ├── DesignModel.tsx            # Unchanged
│       │   ├── CatalogueView.tsx          # Uses server URLs instead of blob URLs
│       │   └── ViewerToolbar.tsx          # Unchanged
│       ├── controls/                      # Unchanged
│       └── auth/
│           ├── LoginForm.tsx              # NEW: email/password + OAuth buttons
│           └── SignupForm.tsx             # NEW: registration form
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

| Method   | Route                    | Purpose                                      |
|----------|--------------------------|----------------------------------------------|
| `POST`   | `/api/projects`          | Create a new project                         |
| `GET`    | `/api/projects`          | List user's projects                         |
| `DELETE` | `/api/projects/[id]`     | Delete project + cascade datasets/assets     |
| `POST`   | `/api/datasets`          | Upload JSON data, parse server-side, insert designs |
| `GET`    | `/api/datasets/[id]`     | Get dataset metadata + all design rows       |
| `DELETE` | `/api/datasets/[id]`     | Delete dataset + designs + assets            |
| `POST`   | `/api/assets/upload`     | Multipart upload → Supabase Storage          |
| `GET`    | `/api/assets/batch-urls`  | Returns signed URLs for multiple assets      |
| `PUT`    | `/api/preferences`       | Update user preferences (theme, default project) |

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

## Data Flow Changes

### File Ingestion

**v1 (current)**:
```
Drop JSON → FileReader → parseDesignData() → Zustand store (browser memory)
```

**v2 (new)**:
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

**v1 (current)**:
```
Drop folder → traverse entries → URL.createObjectURL() → blob URLs in AssetSlice
```

**v2 (new)**:
```
Drop folder → traverse entries → POST /api/assets/upload (multipart, parallel batches of 5-10)
    ↓ server
Store in Supabase Storage at {user_id}/{dataset_id}/{design_key}.{ext}
    ↓ client
On design select → GET /api/assets/batch-urls → signed URLs in AssetSlice
```

- Large GLBs (10-50MB) use Supabase Storage direct-upload (signed upload URL bypasses Vercel's 4.5MB limit)
- Upload progress bar replaces simple "Processing..." state

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
| `Login/Signup pages`      | Yes  | Server-rendered simple forms                     |
| `(app)/layout.tsx`        | Yes  | Checks auth, renders `{children}`               |
| API route handlers        | N/A  | Server only                                      |

### Main Page Pattern
```typescript
// app/(app)/page.tsx (server component — thin wrapper)
import dynamic from 'next/dynamic'
const ExplorerClient = dynamic(() => import('@/components/ExplorerClient'), { ssr: false })
export default function Page() { return <ExplorerClient /> }
```

`ExplorerClient` is `'use client'` and wraps `<TooltipProvider><AppShell /></TooltipProvider>` — essentially the current `App.tsx`.

---

## Zustand Store Changes

| Slice             | v1 Role                        | v2 Role                                         |
|-------------------|-------------------------------|--------------------------------------------------|
| **DataSlice**     | Holds data from local file     | Hydrated from server fetch on page load          |
| **FilterSlice**   | Client-side brush filtering    | Unchanged                                         |
| **SelectionSlice**| Client-side selection          | Unchanged                                         |
| **ViewSlice**     | Client-side view state         | Unchanged                                         |
| **AssetSlice**    | Holds blob URLs                | Holds server signed URLs. `revokeAllUrls()` removed |
| **UISlice**       | Theme, sidebar                 | Theme optionally persisted to DB                  |
| **ProjectSlice**  | —                              | **NEW**: currentProjectId, currentDatasetId, userId |

### What Does NOT Change
- All selectors and derived hooks (`useFilteredDesigns`, `useColorScale`)
- All component subscriptions (granular selector pattern)
- Filter, selection, and view slices (purely client-side interaction state)
- Components don't care whether data came from a dropped file or a server fetch

---

## Implementation Phases

### Phase 0: Supabase Setup
- Create Supabase project (dashboard)
- Create tables + RLS policies via SQL editor
- Create Storage bucket (`design-assets`, private, with auth policies)
- Generate TypeScript types: `supabase gen types typescript`

### Phase 1: Next.js Shell + Auth
- Scaffold Next.js 15 with App Router, TypeScript, `@` path alias
- Configure Tailwind CSS v4 with `@tailwindcss/postcss`
- Copy all `src/` code from Vite project
- Set up `@supabase/ssr` for cookie-based auth
- Build login/signup pages
- Build auth middleware
- Wrap explorer in `'use client'` dynamic import on main route
- **Verify**: app loads behind login wall, all existing UI renders identically

### Phase 2: Data Persistence
- Build `POST /api/datasets` route (receives JSON, parses, inserts dataset + designs)
- Build `GET /api/datasets/[id]` route
- Build `GET /api/projects` and `POST /api/projects` routes
- Modify `DropZone` to upload to server instead of local parse
- Move `parseDesignData` to server-side (`file-ingestion.server.ts`)
- Add `ProjectSlice` to Zustand
- Add hydration logic: on mount, load current project's dataset from API
- **Verify**: drop JSON, refresh page, data is still there

### Phase 3: Asset Storage
- Build `POST /api/assets/upload` route (multipart → Supabase Storage)
- Build `GET /api/assets/batch-urls` route (returns signed URLs)
- Modify `AssetDropZone` to upload files to server with progress bar
- Modify `AssetSlice` to hold server URLs instead of blob URLs
- Add on-demand URL fetching (fetch signed URL when design selected, cache in store)
- **Verify**: upload assets, refresh page, images and models still load

### Phase 4: Multi-User + Projects
- Add project selector UI in sidebar (dropdown or list)
- Add "New Project" flow
- Test RLS: create two users, verify they cannot see each other's data
- Persist user preferences (theme) to `user_preferences` table

### Phase 5: Polish
- Loading states for server fetches (skeletons in viewer/chart area)
- Error handling for failed uploads, network errors
- Signed URL expiration handling (re-fetch if 403)
- Delete project/dataset UI
- Upload progress bar for asset folders
- Test with real-world dataset sizes (100+ designs, large GLBs)

---

## Critical Files Affected

| File                                      | Change                                                      |
|------------------------------------------|-------------------------------------------------------------|
| `src/lib/file-ingestion.ts`              | Split: client keeps drag-drop handling only                  |
| `src/lib/file-ingestion.server.ts`       | New: server-side JSON parsing + DB insertion                 |
| `src/lib/supabase/client.ts`             | New: browser Supabase client                                 |
| `src/lib/supabase/server.ts`             | New: server Supabase client (cookie-based)                   |
| `src/lib/supabase/middleware.ts`         | New: auth middleware helper                                  |
| `src/lib/api.ts`                         | New: client-side fetch wrappers for API routes               |
| `src/store/slices/asset-slice.ts`        | Blob URLs → server URL caching                               |
| `src/store/slices/data-slice.ts`         | Add hydration from server on page load                       |
| `src/store/slices/project-slice.ts`      | New: project/dataset/user tracking                           |
| `src/components/ExplorerClient.tsx`      | New: `'use client'` wrapper for AppShell                     |
| `src/components/ingestion/DropZone.tsx`  | Local file read → server upload                              |
| `src/components/ingestion/AssetDropZone.tsx` | `createObjectURL` → server upload with progress          |
| `src/components/auth/LoginForm.tsx`      | New: login UI                                                |
| `src/components/auth/SignupForm.tsx`      | New: signup UI                                               |
| `middleware.ts`                           | New: auth session check + redirect                           |
| `vite.config.ts`                         | Deleted (replaced by `next.config.ts`)                       |
| `index.html`, `src/main.tsx`            | Deleted (replaced by `app/layout.tsx` + `app/(app)/page.tsx`) |

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
| 0     | Supabase dashboard: tables visible, RLS enabled          | All tables created with policies                     |
| 1     | Visit app URL without login                              | Redirected to /login                                  |
| 1     | Login with email/password                                | Redirected to app, explorer UI renders                |
| 1     | All existing UI works (sidebar, theme, chart, viewer)    | Identical to v1                                       |
| 2     | Drop data.json                                           | Data uploaded, summary shows counts                   |
| 2     | Refresh page                                             | Data still loaded from server                         |
| 3     | Drop asset folder                                        | Upload progress shown, assets stored                  |
| 3     | Refresh page, select design                              | Image/model loads from server URLs                    |
| 4     | Create second user, login                                | Cannot see first user's data                          |
| 4     | Switch between projects                                  | Correct dataset loads for each project                |
| 5     | Upload 100+ designs with GLBs                            | Handles large datasets without timeout                |
| 5     | Network error during upload                              | Error message shown, no crash                         |

---

## Effort Estimate

~10-15 working days for a single developer. The existing component library transfers directly — the work is in building the backend layer and rewiring ingestion/asset flows.
