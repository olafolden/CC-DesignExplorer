# Parameter Controls & Data Settings Hub — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Branch:** `v2/nextjs-migration`

---

## Overview

Add per-parameter visibility, bounds, and step controls to the Parallel Coordinates chart, accessible through a gear-icon settings hub overlaid on the chart panel. This gives users fine-grained control over which parameters are displayed and how each axis is scaled.

## 1. New Zustand Slice — `parameter-settings-slice.ts`

### State Shape

```typescript
interface ParameterSettings {
  isVisible: boolean        // Whether the parameter axis is rendered
  customMin: number | null  // Override lower bound (null = use data-derived min)
  customMax: number | null  // Override upper bound (null = use data-derived max)
  stepCount: number         // Maps to ECharts splitNumber for axis ticks
}

// Keyed by ColumnMeta.key
type ParameterSettingsMap = Record<string, ParameterSettings>
```

### Defaults

When a parameter has no entry in the map (or is first encountered), it uses:
```
{ isVisible: true, customMin: null, customMax: null, stepCount: 5 }
```

### Actions

| Action | Signature | Purpose |
|--------|-----------|---------|
| `setParameterVisible` | `(key: string, visible: boolean) => void` | Toggle axis visibility |
| `setParameterBounds` | `(key: string, min: number \| null, max: number \| null) => void` | Override axis min/max |
| `setParameterStepCount` | `(key: string, count: number) => void` | Set axis tick count |
| `resetParameterSettings` | `() => void` | Clear all overrides back to defaults |

### Integration with Existing Store

- Add `ParameterSettingsSlice` to the combined store in `src/store/index.ts`.
- Add `parameterSettings` to the state cleared by `resetUIForNewDataset()` in the project slice, so stale overrides don't carry over when switching datasets.

## 2. UI Component — `DataSettingsMenu.tsx`

### Location

- New file: `src/components/controls/DataSettingsMenu.tsx`
- Trigger: `Settings2` icon from `lucide-react` (gear/cog), rendered as an absolute-positioned overlay in the top-right corner of the chart panel area inside `MainContent.tsx`.

### Container

- `Popover` (from shadcn/ui) anchored to the gear icon.
- Interior wrapped in `ScrollArea` with `max-height: 400px` to handle large parameter sets.
- Width: ~380px to fit label + switch + 3 number inputs per row.

### Layout

```
+---------------------------------------+
| 24 designs · 5 inputs · 3 outputs     |
+---------------------------------------+
| INPUTS                                |
| ┌───────────────────────────────────┐ |
| │ ParamA  [on/off]  min max  steps  │ |
| │ ParamB  [on/off]  min max  steps  │ |
| └───────────────────────────────────┘ |
| OUTPUTS                               |
| ┌───────────────────────────────────┐ |
| │ ParamC  [on/off]  min max  steps  │ |
| │ ParamD  [on/off]  min max  steps  │ |
| └───────────────────────────────────┘ |
| [Reset all]                           |
+---------------------------------------+
```

### Header

Summary line computed from the loaded dataset:
- Total design count (rows)
- Input column count (role === 'input')
- Output column count (role === 'output')

### Parameter Rows

Each row contains:
1. **Label** — `ColumnMeta.label`, truncated with ellipsis if long
2. **Switch** — shadcn `Switch`, bound to `isVisible`
3. **Min input** — small number `<input>`, placeholder shows data-derived min, disabled when `!isVisible`
4. **Max input** — small number `<input>`, placeholder shows data-derived max, disabled when `!isVisible`
5. **Steps input** — small number `<input>`, default value 5, disabled when `!isVisible`

Parameters are grouped: Inputs first, then Outputs, with a subtle group label above each.

### Footer

- "Reset all" button calling `resetParameterSettings()` to clear all custom overrides.

## 3. Chart Panel Overlay — `MainContent.tsx` Changes

- Wrap the chart area in a `relative` container (if not already).
- Render `DataSettingsMenu` as an absolute-positioned element in the top-right corner of the chart container, with appropriate z-index to float above the chart.
- The gear icon should use muted styling (e.g., `text-muted-foreground`) and brighten on hover to avoid visual clutter.

## 4. ECharts Integration — `useChartOption.ts` Changes

### Axis Filtering

1. Read `parameterSettings` from the Zustand store.
2. For each numeric column, check `parameterSettings[col.key]?.isVisible !== false`.
3. Only include visible columns in the `parallelAxis` array.
4. Rebuild the visual separator index between inputs and outputs based on the filtered column list.

### Bounds Override

For each visible axis:
- If `customMin` is not null, set `axis.min = customMin` (overriding data-derived min).
- If `customMax` is not null, set `axis.max = customMax` (overriding data-derived max).
- When both are null, current behavior is preserved (ECharts auto-scales).

### Step Count

For each visible axis:
- Set `axis.splitNumber = parameterSettings[col.key]?.stepCount ?? 5`.
- ECharts uses `splitNumber` as a hint for the number of axis segments/ticks.

### Data Array Re-indexing

- Since hiding axes changes the positional mapping, the data arrays must be rebuilt to only include values for visible columns, in the correct order matching the filtered `parallelAxis` indices.
- The highlight series (selected design) must also be re-indexed identically.

## 5. Data Flow

```
User toggles setting in DataSettingsMenu
  → Zustand parameterSettings updated
    → useChartOption re-derives (via selector)
      → parallelAxis filtered + bounds/splitNumber applied
      → data arrays re-indexed for visible columns
        → ECharts re-renders with new configuration
```

## 6. Edge Cases

- **All parameters hidden:** Show an empty state message in the chart area (or at minimum, don't crash).
- **Invalid bounds (min > max):** The number inputs should not enforce this at the UI level; ECharts handles this gracefully by swapping. But the placeholder values (data min/max) guide the user.
- **Dataset switch:** `resetUIForNewDataset()` clears `parameterSettings`, so no stale overrides persist.
- **Non-numeric columns:** Already filtered out by `useChartOption` — no change needed.

## 7. Files to Create/Modify

| File | Action |
|------|--------|
| `src/store/slices/parameter-settings-slice.ts` | Create |
| `src/store/types.ts` | Add ParameterSettingsSlice types |
| `src/store/index.ts` | Add new slice to combined store |
| `src/store/slices/project-slice.ts` | Reset parameterSettings in resetUIForNewDataset |
| `src/components/controls/DataSettingsMenu.tsx` | Create |
| `src/components/chart/useChartOption.ts` | Filter axes, apply bounds/splitNumber, re-index data |
| `src/components/layout/MainContent.tsx` | Add gear icon overlay to chart container |

## 8. Testing Strategy

### Unit Tests (Vitest)
- `parameter-settings-slice.test.ts`: Test all actions, defaults, and reset behavior.
- `useChartOption.test.ts`: Test axis filtering, bounds override, splitNumber, and data re-indexing.

### Integration Tests (RTL)
- `DataSettingsMenu.test.tsx`: Test popover opens, summary displays correctly, switch toggles update store, number inputs update bounds/steps, reset button works.

### E2E (Playwright)
- Open settings menu, toggle parameter visibility, verify chart axes update.
- Set custom bounds, verify chart axis range changes.
