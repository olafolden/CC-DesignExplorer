import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'

export function SidebarHeader() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <div className="flex items-center justify-between p-3 border-b border-border">
      {!collapsed && (
        <h1 className="text-sm font-semibold tracking-tight">Design Explorer</h1>
      )}
      <div className="flex items-center gap-1">
        {!collapsed && <ThemeToggle />}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
