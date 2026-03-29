# Design Explorer

A modern web application for exploring multi-objective design iteration data. Inspired by Thornton Tomasetti's Design Explorer.

## Quick Start

```bash
npm install
npm run dev        # starts dev server + opens browser
```

## Available Scripts

| Command            | Description                                |
|--------------------|--------------------------------------------|
| `npm run dev`      | Start dev server with HMR (auto-opens browser) |
| `npm run build`    | Type-check + production build              |
| `npm run preview`  | Preview production build locally           |
| `npm run typecheck`| Run TypeScript type-checker only           |
| `npm run lint`     | Run ESLint                                 |

## Quick Iteration Workflow

1. Run `npm run dev` -- browser opens automatically
2. Edit any file -- Vite HMR updates instantly (no refresh needed)
3. Check the sidebar, theme toggle, and layout to verify changes
4. Run `npm run typecheck` to catch type errors before committing

## Project Status

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full plan.

| Phase | Description                    | Status |
|-------|-------------------------------|--------|
| 1     | Project scaffolding           | Done   |
| 2     | Layout shell                  | Done (basic) |
| 3     | Data ingestion (drag & drop)  | Pending |
| 4     | Parallel coordinates chart    | Pending |
| 5     | 2D/3D viewer                  | Pending |
| 6     | Color mapping & sync          | Pending |
| 7     | Polish & performance          | Pending |

## Tech Stack

- React 19 + TypeScript (Vite 8)
- Tailwind CSS v4
- shadcn/ui (New York style)
- Zustand (state management)
- Apache ECharts (parallel coordinates)
- React Three Fiber (3D viewer)
