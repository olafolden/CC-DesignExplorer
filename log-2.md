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
