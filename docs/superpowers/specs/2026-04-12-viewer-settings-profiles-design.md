# Viewer Settings Profiles — Design Spec

**Date:** 2026-04-12
**Status:** Approved
**Branch:** `v2/nextjs-migration`

---

## Overview

Update the default viewer settings to the user's preferred values (directional=2.0, exposure=3.0, grid=off) and add a profile system that lets users save, load, and delete named snapshots of their viewer settings. Profiles persist in localStorage.

## 1. New Default Settings

Update `DEFAULT_VIEWER_SETTINGS` in `viewer-settings-slice.ts`:
- `directionalIntensity`: 0.8 → **2.0**
- `exposure`: 1.0 → **3.0**
- `gridVisible`: true → **false**

All other defaults unchanged. "Reset All" restores these new values.

## 2. ViewerProfile Type

```typescript
interface ViewerProfile {
  id: string          // crypto.randomUUID()
  name: string        // User-provided name
  settings: ViewerSettings
}
```

## 3. State Changes — `ViewerSettingsSlice`

Add to the existing slice:

| Property/Action | Type | Purpose |
|-----------------|------|---------|
| `viewerProfiles` | `ViewerProfile[]` | Array of saved profiles |
| `saveProfile` | `(name: string) => void` | Snapshot current `viewerSettings` as a named profile, persist to localStorage |
| `loadProfile` | `(id: string) => void` | Apply a profile's settings to `viewerSettings` |
| `deleteProfile` | `(id: string) => void` | Remove a profile from the array and localStorage |

### localStorage

- Key: `design-explorer:viewer-profiles`
- Format: JSON-serialized `ViewerProfile[]`
- On store init: hydrate `viewerProfiles` from localStorage (empty array if missing/invalid)
- On every save/delete: write updated array to localStorage

## 4. UI — Profile Selector in `ViewerSettingsPanel`

Add a compact profile section at the top of the settings panel (above the Scene section):

```
┌─────────────────────────────────┐
│ [Select profile ▾] [💾] [🗑️]  │
├─────────────────────────────────┤
│ Scene                           │
│ ...existing settings...         │
```

- **Select dropdown** (`Select` from shadcn): lists saved profiles by name. Selecting one calls `loadProfile(id)`.
- **Save button** (plus icon): opens an inline text input. On Enter/confirm, calls `saveProfile(name)`.
- **Delete button** (trash icon): enabled only when a profile is selected. Calls `deleteProfile(id)`.

## 5. Files to Create/Modify

| File | Change |
|------|--------|
| `src/store/types.ts` | Add `ViewerProfile`, expand `ViewerSettingsSlice` |
| `src/store/slices/viewer-settings-slice.ts` | New defaults, profile actions, localStorage hydration |
| `src/components/viewer/ViewerSettingsPanel.tsx` | Profile selector UI at top |
| `src/store/__tests__/viewer-settings-slice.test.ts` | Tests for defaults, save/load/delete profiles |
| `ARCHITECTURE.md` | Update state management section, add ParameterSettingsSlice, note profiles |
| `CHANGELOG.md` | Add entries for parameter controls, bug fixes, and viewer profiles |

## 6. Testing

- **viewer-settings-slice.test.ts**: Test new defaults, saveProfile creates entry, loadProfile applies settings, deleteProfile removes entry, resetViewerSettings uses new defaults, localStorage round-trip.
