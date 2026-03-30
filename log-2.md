# Design Explorer v2 — Change Log

## Phase 1 — Next.js Shell + Placeholder Auth (2026-03-30)
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

## Phase 0 — Supabase Setup (2026-03-30)
- Supabase project created (iorfzztfqcbhbulqxmfg)
- SQL migration: 5 tables (projects, datasets, designs, assets, user_preferences)
- Row Level Security enabled on all tables with per-user policies
- Storage bucket `design-assets` created (private)
- Migration script saved to supabase/migrations/001_initial_schema.sql

## Phase 2 — Data Persistence + Real Auth (2026-03-30)
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

## Phase 3 — Asset Storage (2026-03-30)
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

## Phase 4 — Multi-User + Projects (2026-03-30)
- Project selector in sidebar: dropdown to switch projects, create new, delete existing
- Switching projects clears current data/assets and loads the new project's latest dataset + assets
- New project flow: inline name input with Enter or Create button
- Delete project: confirmation dialog, cascades to datasets/designs/assets
- User preferences API route (GET/PUT /api/preferences): persists theme and default project
- Theme persistence: toggling theme saves to server via user_preferences table
- Hydration loads preferences in parallel with projects, applies saved theme and default project
- API helpers added: fetchPreferences, updatePreferences, fetchProjectDatasets
- Build passes, TypeScript clean

## Phase 5 — Polish (2026-03-30)
- Loading skeleton: shows spinner + skeleton bars in chart/viewer area during hydration
- Signed URL expiration: useRefreshAssets hook auto-re-fetches asset URLs on image 403 errors
- ImageViewer and CatalogueView both trigger asset URL refresh on load failures
- Delete dataset UI: button in project section to delete current dataset with confirmation
- ProjectSelector refactored: extracted shared loadDataset helper, cleaner state management
- Build passes, TypeScript clean
