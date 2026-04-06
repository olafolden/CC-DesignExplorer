# Parameter Controls & Data Settings Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-parameter visibility, bounds, and step controls to the Parallel Coordinates chart via a gear-icon popover settings hub.

**Architecture:** New Zustand slice (`ParameterSettingsSlice`) stores per-parameter overrides keyed by `ColumnMeta.key`. A `DataSettingsMenu` component (Popover + ScrollArea) is overlaid on the chart panel. `useChartOption` reads the slice to filter axes, apply bounds/splitNumber, and re-index data arrays.

**Tech Stack:** Zustand, shadcn/ui (Popover, Switch, ScrollArea, Button), lucide-react (Settings2), ECharts, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/store/types.ts` | Modify | Add `ParameterSettings`, `ParameterSettingsMap`, `ParameterSettingsSlice` types; update `AppStore` |
| `src/store/slices/parameter-settings-slice.ts` | Create | Slice with state + 4 actions |
| `src/store/index.ts` | Modify | Wire new slice into combined store |
| `src/store/slices/project-slice.ts` | Modify | Clear `parameterSettings` in `resetUIForNewDataset` |
| `src/store/__tests__/parameter-settings-slice.test.ts` | Create | Unit tests for the new slice |
| `src/components/controls/DataSettingsMenu.tsx` | Create | Popover UI with summary, parameter rows, reset button |
| `src/components/chart/useChartOption.ts` | Modify | Filter axes by visibility, apply bounds/splitNumber, re-index data |
| `src/components/layout/MainContent.tsx` | Modify | Add gear icon overlay to chart panel |

---

### Task 1: Add types to the store

**Files:**
- Modify: `src/store/types.ts`

- [ ] **Step 1: Add ParameterSettingsSlice types**

In `src/store/types.ts`, add these types after the `ViewerSettingsSlice` interface (before the `AppStore` type alias):

```typescript
export interface ParameterSettings {
  isVisible: boolean
  customMin: number | null
  customMax: number | null
  stepCount: number
}

export type ParameterSettingsMap = Record<string, ParameterSettings>

export interface ParameterSettingsSlice {
  parameterSettings: ParameterSettingsMap
  setParameterVisible: (key: string, visible: boolean) => void
  setParameterBounds: (key: string, min: number | null, max: number | null) => void
  setParameterStepCount: (key: string, count: number) => void
  resetParameterSettings: () => void
}
```

Then update the `AppStore` type alias to include the new slice:

```typescript
export type AppStore = FilterSlice &
  SelectionSlice &
  ViewSlice &
  UISlice &
  ProjectSlice &
  ViewerSettingsSlice &
  ParameterSettingsSlice
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: Errors about missing `createParameterSettingsSlice` in `src/store/index.ts` and missing `parameterSettings` in `src/store/slices/project-slice.ts` — this is correct because those files haven't been updated yet. No errors from `types.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add src/store/types.ts
git commit -m "feat(store): add ParameterSettingsSlice types"
```

---

### Task 2: Create the parameter settings slice (TDD)

**Files:**
- Create: `src/store/__tests__/parameter-settings-slice.test.ts`
- Create: `src/store/slices/parameter-settings-slice.ts`
- Modify: `src/store/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/store/__tests__/parameter-settings-slice.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../index'

const DEFAULT_SETTINGS = {
  isVisible: true,
  customMin: null,
  customMax: null,
  stepCount: 5,
}

describe('ParameterSettingsSlice', () => {
  beforeEach(() => {
    useAppStore.getState().resetParameterSettings()
  })

  it('initializes with empty parameterSettings', () => {
    expect(useAppStore.getState().parameterSettings).toEqual({})
  })

  it('setParameterVisible creates entry with defaults when key is new', () => {
    useAppStore.getState().setParameterVisible('area', false)
    expect(useAppStore.getState().parameterSettings.area).toEqual({
      ...DEFAULT_SETTINGS,
      isVisible: false,
    })
  })

  it('setParameterVisible updates existing entry', () => {
    useAppStore.getState().setParameterVisible('area', false)
    useAppStore.getState().setParameterVisible('area', true)
    expect(useAppStore.getState().parameterSettings.area.isVisible).toBe(true)
  })

  it('setParameterBounds sets custom min and max', () => {
    useAppStore.getState().setParameterBounds('height', 10, 100)
    const settings = useAppStore.getState().parameterSettings.height
    expect(settings.customMin).toBe(10)
    expect(settings.customMax).toBe(100)
  })

  it('setParameterBounds allows null to clear overrides', () => {
    useAppStore.getState().setParameterBounds('height', 10, 100)
    useAppStore.getState().setParameterBounds('height', null, null)
    const settings = useAppStore.getState().parameterSettings.height
    expect(settings.customMin).toBeNull()
    expect(settings.customMax).toBeNull()
  })

  it('setParameterStepCount updates stepCount', () => {
    useAppStore.getState().setParameterStepCount('width', 10)
    expect(useAppStore.getState().parameterSettings.width.stepCount).toBe(10)
  })

  it('resetParameterSettings clears all overrides', () => {
    useAppStore.getState().setParameterVisible('a', false)
    useAppStore.getState().setParameterBounds('b', 0, 50)
    useAppStore.getState().setParameterStepCount('c', 8)

    useAppStore.getState().resetParameterSettings()
    expect(useAppStore.getState().parameterSettings).toEqual({})
  })

  it('actions preserve settings for other keys', () => {
    useAppStore.getState().setParameterVisible('a', false)
    useAppStore.getState().setParameterBounds('b', 0, 50)

    expect(useAppStore.getState().parameterSettings.a.isVisible).toBe(false)
    expect(useAppStore.getState().parameterSettings.b.customMin).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/__tests__/parameter-settings-slice.test.ts 2>&1 | tail -20`

Expected: FAIL — `resetParameterSettings` is not a function (slice doesn't exist yet).

- [ ] **Step 3: Create the slice implementation**

Create `src/store/slices/parameter-settings-slice.ts`:

```typescript
import type { StateCreator } from 'zustand'
import type { AppStore, ParameterSettingsSlice, ParameterSettings } from '../types'

const DEFAULT_SETTINGS: ParameterSettings = {
  isVisible: true,
  customMin: null,
  customMax: null,
  stepCount: 5,
}

export const createParameterSettingsSlice: StateCreator<
  AppStore,
  [],
  [],
  ParameterSettingsSlice
> = (set, get) => ({
  parameterSettings: {},

  setParameterVisible: (key, visible) =>
    set((state) => ({
      parameterSettings: {
        ...state.parameterSettings,
        [key]: {
          ...DEFAULT_SETTINGS,
          ...state.parameterSettings[key],
          isVisible: visible,
        },
      },
    })),

  setParameterBounds: (key, min, max) =>
    set((state) => ({
      parameterSettings: {
        ...state.parameterSettings,
        [key]: {
          ...DEFAULT_SETTINGS,
          ...state.parameterSettings[key],
          customMin: min,
          customMax: max,
        },
      },
    })),

  setParameterStepCount: (key, count) =>
    set((state) => ({
      parameterSettings: {
        ...state.parameterSettings,
        [key]: {
          ...DEFAULT_SETTINGS,
          ...state.parameterSettings[key],
          stepCount: count,
        },
      },
    })),

  resetParameterSettings: () => set({ parameterSettings: {} }),
})
```

- [ ] **Step 4: Wire the slice into the store**

In `src/store/index.ts`, add the import and spread:

```typescript
import { createParameterSettingsSlice } from './slices/parameter-settings-slice'
```

Add to the `create<AppStore>()` call, after `...createViewerSettingsSlice(...a),`:

```typescript
...createParameterSettingsSlice(...a),
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/store/__tests__/parameter-settings-slice.test.ts 2>&1 | tail -20`

Expected: All 8 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/slices/parameter-settings-slice.ts src/store/index.ts src/store/__tests__/parameter-settings-slice.test.ts
git commit -m "feat(store): add parameter-settings slice with TDD tests"
```

---

### Task 3: Integrate resetUIForNewDataset with parameter settings

**Files:**
- Modify: `src/store/slices/project-slice.ts`
- Modify: `src/store/__tests__/filter-slice.test.ts` (add one test case)

- [ ] **Step 1: Add a failing test**

Append this test to the end of the `describe` block in `src/store/__tests__/filter-slice.test.ts`:

```typescript
  it('resetUIForNewDataset clears parameterSettings', () => {
    useAppStore.getState().setParameterVisible('x', false)
    useAppStore.getState().setParameterBounds('y', 10, 50)

    useAppStore.getState().resetUIForNewDataset()

    expect(useAppStore.getState().parameterSettings).toEqual({})
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/__tests__/filter-slice.test.ts 2>&1 | tail -15`

Expected: FAIL — `parameterSettings` still has entries after `resetUIForNewDataset`.

- [ ] **Step 3: Update project-slice to clear parameterSettings**

In `src/store/slices/project-slice.ts`, add `parameterSettings: {}` to the `resetUIForNewDataset` set call:

```typescript
  resetUIForNewDataset: () =>
    set({
      brushRanges: [],
      colorMetricKey: null,
      selectedDesignId: null,
      hoveredDesignId: null,
      parameterSettings: {},
    }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/store/__tests__/filter-slice.test.ts 2>&1 | tail -15`

Expected: All tests PASS (including the new one).

- [ ] **Step 5: Commit**

```bash
git add src/store/slices/project-slice.ts src/store/__tests__/filter-slice.test.ts
git commit -m "feat(store): clear parameterSettings on dataset switch"
```

---

### Task 4: Update useChartOption to filter axes and apply settings

**Files:**
- Modify: `src/components/chart/useChartOption.ts`

This is the core integration task. `useChartOption` must:
1. Read `parameterSettings` from the store.
2. Filter `numericCols` to only visible columns.
3. Apply custom bounds (`customMin`/`customMax`) to each axis.
4. Apply `stepCount` as `splitNumber` on each axis.
5. Re-index data arrays to match the filtered columns.

- [ ] **Step 1: Add parameterSettings selector**

At the top of `useChartOption`, add:

```typescript
const parameterSettings = useAppStore((s) => s.parameterSettings)
```

And add `parameterSettings` to the `useMemo` dependency array at the end of the hook.

- [ ] **Step 2: Filter numeric columns by visibility**

Inside the `useMemo`, after the existing `numericCols` line:

```typescript
const numericCols = columns.filter((c) => c.type === 'number')
```

Add:

```typescript
const visibleCols = numericCols.filter(
  (c) => parameterSettings[c.key]?.isVisible !== false
)
if (visibleCols.length === 0) return null
```

- [ ] **Step 3: Replace all references to numericCols with visibleCols**

Throughout the rest of the `useMemo` callback, replace every reference to `numericCols` with `visibleCols`:

1. The `colorCol` lookup:
```typescript
const colorCol = colorMetricKey
  ? visibleCols.find((c) => c.key === colorMetricKey)
  : null
```

2. The `firstOutputIdx` calculation:
```typescript
const firstOutputIdx = visibleCols.findIndex((c) => c.role === 'output')
```

3. The `parallelAxis` map — also apply bounds and splitNumber:
```typescript
const parallelAxis = visibleCols.map((col, i) => {
  const settings = parameterSettings[col.key]
  return {
    dim: i,
    name: col.label,
    min: settings?.customMin ?? col.min,
    max: settings?.customMax ?? col.max,
    splitNumber: settings?.stepCount ?? 5,
    nameTextStyle: {
      color: col.role === 'output' ? OUTPUT_AXIS_COLOR : INPUT_AXIS_COLOR,
      fontSize: 11,
      fontWeight: 'bold' as const,
    },
    axisLine: {
      lineStyle: {
        color: col.role === 'output'
          ? 'rgba(251,191,36,0.35)'
          : 'rgba(56,189,248,0.35)',
      },
    },
    axisLabel: {
      color: textColor,
      fontSize: 10,
    },
  }
})
```

4. The `seriesData` map:
```typescript
const seriesData = rawData.map((row) => {
  const values = visibleCols.map((col) => row[col.key] as number)
  // ... rest stays the same
})
```

5. The separator graphic calculation:
```typescript
const markLine = firstOutputIdx > 0
  ? {
      graphic: [
        {
          type: 'line' as const,
          shape: { x1: 0, y1: 0, x2: 0, y2: 1 },
        },
        {
          type: 'text' as const,
          left: `${((firstOutputIdx - 0.5) / (visibleCols.length - 1)) * 100}%`,
          top: 8,
          style: {
            text: '|',
            fill: theme === 'dark' ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.2)',
            fontSize: 20,
            fontWeight: 'bold' as const,
          },
        },
      ],
    }
  : {}
```

6. The highlight series (selected design):
```typescript
const values = visibleCols.map((col) => row[col.key] as number)
```

- [ ] **Step 4: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 5: Run all existing tests to check for regressions**

Run: `npx vitest run 2>&1 | tail -20`

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/chart/useChartOption.ts
git commit -m "feat(chart): filter axes by visibility, apply custom bounds and splitNumber"
```

---

### Task 5: Update useChartEvents for axis index mapping

**Files:**
- Modify: `src/components/chart/useChartEvents.ts`

Since axes now map to `visibleCols` (not `numericCols`), the brush event handler must also filter to visible columns so `BrushRange.key` stays correct.

- [ ] **Step 1: Add parameterSettings to the hook**

At the top of `useChartEvents`, add:

```typescript
const parameterSettings = useAppStore((s) => s.parameterSettings)
```

- [ ] **Step 2: Filter to visible columns**

Replace:

```typescript
const numericCols = columns.filter((c) => c.type === 'number')
```

With:

```typescript
const numericCols = columns.filter((c) => c.type === 'number')
const visibleCols = numericCols.filter(
  (c) => parameterSettings[c.key]?.isVisible !== false
)
```

- [ ] **Step 3: Use visibleCols in the event handler**

In `handleAxisAreaSelected`, replace the reference inside the for-loop:

```typescript
const col = visibleCols[i]
```

And update the dependency array of the `useCallback`:

```typescript
[visibleCols, setBrushRanges]
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/chart/useChartEvents.ts
git commit -m "fix(chart): align brush events with visible-only axis indices"
```

---

### Task 6: Create the DataSettingsMenu component

**Files:**
- Create: `src/components/controls/DataSettingsMenu.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/controls/DataSettingsMenu.tsx`:

```tsx
'use client'

import { Settings2, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ColumnMeta } from '@/types/design'

function ParameterRow({ col }: { col: ColumnMeta }) {
  const settings = useAppStore((s) => s.parameterSettings[col.key])
  const setParameterVisible = useAppStore((s) => s.setParameterVisible)
  const setParameterBounds = useAppStore((s) => s.setParameterBounds)
  const setParameterStepCount = useAppStore((s) => s.setParameterStepCount)

  const isVisible = settings?.isVisible !== false
  const customMin = settings?.customMin ?? ''
  const customMax = settings?.customMax ?? ''
  const stepCount = settings?.stepCount ?? 5

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span
        className="text-xs font-medium truncate min-w-0 flex-1"
        title={col.label}
      >
        {col.label}
      </span>
      <Switch
        size="sm"
        checked={isVisible}
        onCheckedChange={(checked) => setParameterVisible(col.key, checked)}
        aria-label={`Toggle ${col.label} visibility`}
      />
      <input
        type="number"
        className="h-6 w-14 rounded border border-input bg-background px-1.5 text-xs tabular-nums disabled:opacity-40"
        placeholder={col.min != null ? String(col.min) : '—'}
        value={customMin}
        disabled={!isVisible}
        onChange={(e) => {
          const val = e.target.value === '' ? null : Number(e.target.value)
          setParameterBounds(col.key, val, settings?.customMax ?? null)
        }}
        aria-label={`${col.label} min`}
      />
      <input
        type="number"
        className="h-6 w-14 rounded border border-input bg-background px-1.5 text-xs tabular-nums disabled:opacity-40"
        placeholder={col.max != null ? String(col.max) : '—'}
        value={customMax}
        disabled={!isVisible}
        onChange={(e) => {
          const val = e.target.value === '' ? null : Number(e.target.value)
          setParameterBounds(col.key, settings?.customMin ?? null, val)
        }}
        aria-label={`${col.label} max`}
      />
      <input
        type="number"
        className="h-6 w-12 rounded border border-input bg-background px-1.5 text-xs tabular-nums disabled:opacity-40"
        value={stepCount}
        min={1}
        max={20}
        disabled={!isVisible}
        onChange={(e) => {
          const val = Number(e.target.value)
          if (val >= 1 && val <= 20) setParameterStepCount(col.key, val)
        }}
        aria-label={`${col.label} steps`}
      />
    </div>
  )
}

export function DataSettingsMenu() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const resetParameterSettings = useAppStore((s) => s.resetParameterSettings)
  const { data: datasetResponse } = useDataset(currentDatasetId)

  const columns = datasetResponse?.columns ?? []
  const rowCount = datasetResponse?.data?.length ?? 0
  const numericCols = columns.filter((c) => c.type === 'number')
  const inputCols = numericCols.filter((c) => c.role === 'input')
  const outputCols = numericCols.filter((c) => c.role === 'output')

  if (numericCols.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Data settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end" side="bottom">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs text-muted-foreground">
            {rowCount} designs · {inputCols.length} inputs · {outputCols.length} outputs
          </p>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="px-3 py-2">
            {/* Column headers */}
            <div className="flex items-center gap-2 pb-1 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 flex-1">Parameter</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-[30px] text-center">Vis</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-14 text-center">Min</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-14 text-center">Max</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-12 text-center">Steps</span>
            </div>

            {inputCols.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-400 mt-1 mb-0.5">
                  Inputs
                </p>
                {inputCols.map((col) => (
                  <ParameterRow key={col.key} col={col} />
                ))}
              </>
            )}

            {outputCols.length > 0 && (
              <>
                {inputCols.length > 0 && <Separator className="my-2" />}
                <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 mt-1 mb-0.5">
                  Outputs
                </p>
                {outputCols.map((col) => (
                  <ParameterRow key={col.key} col={col} />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
        <div className="px-3 py-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => resetParameterSettings()}
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Reset all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/controls/DataSettingsMenu.tsx
git commit -m "feat(controls): create DataSettingsMenu popover component"
```

---

### Task 7: Mount DataSettingsMenu in MainContent

**Files:**
- Modify: `src/components/layout/MainContent.tsx`

- [ ] **Step 1: Add import**

At the top of `MainContent.tsx`, add:

```typescript
import { DataSettingsMenu } from '@/components/controls/DataSettingsMenu'
```

- [ ] **Step 2: Update the chart panel to include the gear overlay**

Replace the `chartPanel` const:

```typescript
  const chartPanel = (
    <div
      key="chart"
      className="relative overflow-hidden border-t border-border bg-card"
      style={{ flex: `${panelsSwapped ? 1 - chartRatio : chartRatio} 1 0%` }}
    >
      {isDataLoaded && (
        <div className="absolute top-2 right-2 z-10">
          <DataSettingsMenu />
        </div>
      )}
      {isHydrating ? <HydrationSkeleton /> : isDataLoaded ? <ParallelCoordinates /> : <ChartEmpty />}
    </div>
  )
```

Changes from original:
- Added `relative` to className (needed for absolute positioning of the overlay).
- Added the `DataSettingsMenu` wrapper div with `absolute top-2 right-2 z-10`.
- Only renders the gear icon when data is loaded (`isDataLoaded`).

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 4: Run all tests**

Run: `npx vitest run 2>&1 | tail -20`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/MainContent.tsx
git commit -m "feat(layout): mount DataSettingsMenu gear icon on chart panel"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run 2>&1`

Expected: All tests PASS.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1`

Expected: No errors.

- [ ] **Step 3: Run linter**

Run: `npx eslint src/store/slices/parameter-settings-slice.ts src/components/controls/DataSettingsMenu.tsx src/components/chart/useChartOption.ts src/components/chart/useChartEvents.ts src/components/layout/MainContent.tsx 2>&1`

Expected: No errors (or only pre-existing warnings).

- [ ] **Step 4: Run dev server and manual smoke test**

Run: `npx next dev`

Manual checks:
1. Load a dataset — gear icon appears in top-right of chart
2. Click gear — popover shows summary (designs/inputs/outputs), parameter list
3. Toggle a parameter off — axis disappears from chart
4. Set custom min/max — axis rescales
5. Change step count — axis tick count changes
6. Reset all — everything returns to defaults
7. Switch dataset — settings are cleared

- [ ] **Step 5: Commit any lint fixes if needed, then final commit**

```bash
git add -A
git commit -m "chore: lint fixes for parameter controls feature"
```
