# Phase 1: Next.js Shell + Placeholder Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Vite with Next.js 15 App Router, copy all existing components, add placeholder auth with skip button, stub Supabase config. The explorer UI must render identically to v1.

**Architecture:** Next.js App Router wraps the existing client-side explorer. The entire explorer UI lives in a single `'use client'` component (`ExplorerClient.tsx`). ECharts and Three.js components get `dynamic()` wrappers with `ssr: false`. A placeholder login page with a "skip" button simulates auth. Supabase client stubs are created with placeholder env vars.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.9, Tailwind CSS v4 (PostCSS), shadcn/ui, Zustand 5, ECharts 6, React Three Fiber 9, @supabase/ssr (stubbed)

---

### Task 1: Create branch and remove Vite-specific files

**Files:**
- Delete: `vite.config.ts`
- Delete: `index.html`
- Delete: `src/main.tsx`
- Delete: `tsconfig.node.json`

- [ ] **Step 1: Create the v2 branch**

```bash
git checkout -b v2/nextjs-migration
```

- [ ] **Step 2: Delete Vite-specific files**

```bash
rm vite.config.ts index.html src/main.tsx tsconfig.node.json
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove Vite-specific files for Next.js migration"
```

---

### Task 2: Update package.json and install Next.js dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove Vite dependencies and add Next.js**

```bash
npm uninstall vite @vitejs/plugin-react @tailwindcss/vite
npm install next@latest @supabase/supabase-js @supabase/ssr
npm install -D @tailwindcss/postcss
```

- [ ] **Step 2: Update package.json scripts**

Replace the `"scripts"` block in `package.json` with:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap Vite for Next.js, add Supabase stubs"
```

---

### Task 3: Configure Next.js, TypeScript, and Tailwind for PostCSS

**Files:**
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json` → rename to `tsconfig.json` (single file)
- Delete: `tsconfig.app.json`
- Create: `.env.local`

- [ ] **Step 1: Create `next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow GLB/GLTF blob URLs and Supabase storage URLs in images
  images: {
    unoptimized: true,
  },
  // Suppress React Three Fiber SSR warnings
  serverExternalPackages: ['three'],
}

export default nextConfig
```

- [ ] **Step 2: Create `postcss.config.mjs`**

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

- [ ] **Step 3: Replace `tsconfig.json` with a single flat config**

Delete `tsconfig.app.json`. Replace `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowImportingTsExtensions": true,
    "moduleDetection": "force",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "incremental": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [
      { "name": "next" }
    ]
  },
  "include": ["src", "app", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `.env.local` with placeholder Supabase vars**

```
# Supabase (placeholder — replace with real values when Supabase project is created)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
```

- [ ] **Step 5: Add `.env.local` to `.gitignore`**

Append to `.gitignore`:

```
# env
.env.local
.env*.local
```

- [ ] **Step 6: Commit**

```bash
git add next.config.ts postcss.config.mjs tsconfig.json .gitignore
git rm tsconfig.app.json 2>/dev/null; true
git commit -m "chore: configure Next.js, PostCSS Tailwind, TypeScript"
```

---

### Task 4: Create Next.js App Router layout and pages

**Files:**
- Create: `app/layout.tsx`
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/page.tsx`
- Create: `app/login/page.tsx`
- Create: `src/components/ExplorerClient.tsx`

- [ ] **Step 1: Create root layout `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Design Explorer',
  description: 'Explore multi-objective design iteration data',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Create app group layout `app/(app)/layout.tsx`**

This layout will later check auth. For now it's a passthrough.

```tsx
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

- [ ] **Step 3: Create `src/components/ExplorerClient.tsx`**

This is the `'use client'` wrapper that replaces `App.tsx` + `main.tsx`:

```tsx
'use client'

import { useEffect, useCallback } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ExplorerClient() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    switch (e.key) {
      case 'Escape':
        useAppStore.getState().setSelectedDesignId(null)
        useAppStore.getState().setHoveredDesignId(null)
        break
      case 't':
      case 'T':
        if (!e.ctrlKey && !e.metaKey) useAppStore.getState().toggleTheme()
        break
      case '[':
        useAppStore.getState().toggleSidebar()
        break
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <TooltipProvider>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </TooltipProvider>
  )
}
```

- [ ] **Step 4: Create main page `app/(app)/page.tsx`**

```tsx
import dynamic from 'next/dynamic'

const ExplorerClient = dynamic(() => import('@/components/ExplorerClient'), {
  ssr: false,
})

export default function ExplorePage() {
  return <ExplorerClient />
}
```

- [ ] **Step 5: Create placeholder login page `app/login/page.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { Compass } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Compass className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Design Explorer</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            disabled
            className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/50"
          />
          <input
            type="password"
            placeholder="Password"
            disabled
            className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Skip Login (Dev Mode)
        </button>

        <p className="text-center text-xs text-muted-foreground/60">
          Auth will be wired to Supabase in Phase 2
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/ src/components/ExplorerClient.tsx
git commit -m "feat: Next.js App Router shell with placeholder login"
```

---

### Task 5: Add dynamic imports for SSR-incompatible components

**Files:**
- Modify: `src/components/viewer/ViewerPanel.tsx`
- Modify: `src/components/layout/MainContent.tsx`

These components import ECharts and Three.js which reference `window` at import time. They need `dynamic()` wrappers.

- [ ] **Step 1: Read ViewerPanel.tsx and MainContent.tsx to understand current imports**

Read the files to see how `ModelViewer` and `ParallelCoordinates` are imported.

- [ ] **Step 2: Update `MainContent.tsx` to dynamically import `ParallelCoordinates`**

Replace the static import:
```tsx
import { ParallelCoordinates } from '@/components/chart/ParallelCoordinates'
```

With a dynamic import:
```tsx
import dynamic from 'next/dynamic'

const ParallelCoordinates = dynamic(
  () => import('@/components/chart/ParallelCoordinates').then(mod => ({ default: mod.ParallelCoordinates })),
  { ssr: false }
)
```

Add `'use client'` directive at the top of the file if not already present.

- [ ] **Step 3: Update `ViewerPanel.tsx` to dynamically import `ModelViewer`**

Replace the static import:
```tsx
import { ModelViewer } from '@/components/viewer/ModelViewer'
```

With a dynamic import:
```tsx
import dynamic from 'next/dynamic'

const ModelViewer = dynamic(
  () => import('@/components/viewer/ModelViewer').then(mod => ({ default: mod.ModelViewer })),
  { ssr: false }
)
```

Add `'use client'` directive at the top of the file if not already present.

- [ ] **Step 4: Add default exports to ParallelCoordinates and ModelViewer**

These components currently use named exports. Add a default export alongside the named export to each file:

In `src/components/chart/ParallelCoordinates.tsx`, add at the bottom:
```tsx
export default ParallelCoordinates
```

In `src/components/viewer/ModelViewer.tsx`, add at the bottom:
```tsx
export default ModelViewer
```

This allows `dynamic(() => import(...))` to work without the `.then()` wrapper. Update the dynamic imports in Step 2 and 3 to the simpler form:

```tsx
const ParallelCoordinates = dynamic(() => import('@/components/chart/ParallelCoordinates'), { ssr: false })
const ModelViewer = dynamic(() => import('@/components/viewer/ModelViewer'), { ssr: false })
```

- [ ] **Step 5: Commit**

```bash
git add src/components/viewer/ViewerPanel.tsx src/components/layout/MainContent.tsx src/components/chart/ParallelCoordinates.tsx src/components/viewer/ModelViewer.tsx
git commit -m "feat: dynamic imports for ECharts and Three.js (SSR-safe)"
```

---

### Task 6: Create Supabase client stubs

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: Create browser client stub `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server client stub `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/
git commit -m "chore: add Supabase client stubs (placeholder config)"
```

---

### Task 7: Clean up old App.tsx, update components.json, verify build

**Files:**
- Delete: `src/App.tsx` (replaced by `ExplorerClient.tsx`)
- Modify: `components.json` (update for Next.js)

- [ ] **Step 1: Delete old App.tsx**

```bash
rm src/App.tsx
```

- [ ] **Step 2: Update `components.json` for Next.js**

Set `"rsc": true` since Next.js uses React Server Components by default (individual components opt in with `'use client'`):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Note: remove `"resolvedPaths"` — not needed for Next.js with the `@/` alias.

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: passes with no errors (or only warnings about `next-env.d.ts` not existing yet, which `next dev` generates).

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: Next.js builds successfully. The explorer page is dynamically rendered (no SSR for the client component).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: clean up old entry points, update shadcn config for Next.js"
```

---

### Task 8: Verify dev server and visual check

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: Next.js dev server starts at `http://localhost:3000`.

- [ ] **Step 2: Visual check — login page**

Open `http://localhost:3000/login` in browser.

Expected: Centered card with Compass icon, "Design Explorer" title, disabled email/password inputs, "Skip Login (Dev Mode)" button. Dark theme styling.

- [ ] **Step 3: Visual check — skip to explorer**

Click "Skip Login (Dev Mode)" button.

Expected: Redirects to `/`. Explorer UI renders identically to v1: sidebar (collapsible), theme toggle, drop zones, empty states for viewer and chart.

- [ ] **Step 4: Visual check — existing features**

Test the following still work:
- Sidebar collapse/expand
- Theme toggle (light/dark)
- Drag-drop data.json → chart renders
- Drag-drop asset folder → images load
- Parallel coordinates brushing
- 2D/3D viewer toggle
- Catalogue view
- Design selector with X clear button

- [ ] **Step 5: Final commit with any fixes**

If any fixes were needed during visual testing:

```bash
git add -A
git commit -m "fix: resolve issues found during visual testing"
```
