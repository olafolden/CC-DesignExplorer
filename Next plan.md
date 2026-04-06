Act as a Senior Staff Full-Stack Next.js Engineer. I am working on migrating a Vite React SPA to a Next.js 15 App Router full-stack application. The app uses Supabase (Auth, Postgres, Storage), Zustand, React Three Fiber, and ECharts.

I have an initial architecture plan, but it has 4 major architectural anti-patterns that I need your help to refactor and fix. 

Here are the 4 issues we need to solve:

1. **State Management Mix-up:** The current architecture plans to fetch database data (server state) and shove it into Zustand (client state) on page load. I want to separate this. We need to introduce React Query (or use React Server Components effectively) for server state (fetching projects, datasets, designs) and restrict Zustand strictly to synchronous UI/client state (theme, selected design, brush ranges).
2. **Missing Test Infrastructure:** There is no testing strategy. I need you to set up Vitest and React Testing Library for unit/integration testing (especially for the complex data parsing logic), and suggest a basic Playwright setup for E2E testing the critical paths.
3. **Insecure File Uploads:** The plan relies on direct-from-client uploads to Supabase Storage using signed URLs to bypass Vercel limits. I need to secure this. Propose and implement a pattern where the client requests an upload, uploads to a temporary/quarantine bucket, and a secure server-side process (Next.js API route or Supabase Webhook) validates the file type/size before moving it to the permanent bucket and updating the DB.
4. **Heavy-Handed SSR Disabling:** The plan wraps the entire `ExplorerClient` (including layouts and sidebars) in `next/dynamic` with `ssr: false`. I want to fix this so the Next.js layout, sidebar, and standard UI render on the server, and ONLY the specific browser-dependent canvases (ECharts and React Three Fiber) are dynamically imported.

**Your Task:**
Do not write the entire codebase at once. 
First, acknowledge these 4 goals and provide a high-level, step-by-step implementation plan for how we will tackle them one by one. Wait for my approval on the plan. Once approved, we will start with Step 1.