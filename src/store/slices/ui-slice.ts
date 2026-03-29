import type { StateCreator } from 'zustand'
import type { AppStore, UISlice } from '../types'

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set, get) => ({
  theme: 'dark',
  sidebarCollapsed: false,
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
  },
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
})
