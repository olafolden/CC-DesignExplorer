import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createDataSlice } from './slices/data-slice'
import { createFilterSlice } from './slices/filter-slice'
import { createSelectionSlice } from './slices/selection-slice'
import { createViewSlice } from './slices/view-slice'
import { createAssetSlice } from './slices/asset-slice'
import { createUISlice } from './slices/ui-slice'
import { createProjectSlice } from './slices/project-slice'
import { createViewerSettingsSlice } from './slices/viewer-settings-slice'
import type { AppStore } from './types'

export const useAppStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createDataSlice(...a),
      ...createFilterSlice(...a),
      ...createSelectionSlice(...a),
      ...createViewSlice(...a),
      ...createAssetSlice(...a),
      ...createUISlice(...a),
      ...createProjectSlice(...a),
      ...createViewerSettingsSlice(...a),
    }),
    { name: 'DesignExplorerStore' }
  )
)
