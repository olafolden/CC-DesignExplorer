'use client'

import { useEffect, useCallback } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useHydrate } from '@/hooks/useHydrate'

export default function ExplorerClient() {
  const theme = useAppStore((s) => s.theme)
  useHydrate()

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
