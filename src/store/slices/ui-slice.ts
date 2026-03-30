import type { StateCreator } from 'zustand'
import type { AppStore, UISlice } from '../types'
import { updatePreferences } from '@/lib/api'

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set, get) => ({
  theme: 'dark',
  sidebarCollapsed: false,
  panelsSwapped: false,
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
    // Persist to server (fire-and-forget)
    updatePreferences({ theme: next }).catch(() => {})
  },
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  togglePanelSwap: () => set((s) => ({ panelsSwapped: !s.panelsSwapped })),
})
