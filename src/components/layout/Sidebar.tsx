import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { SidebarHeader } from './SidebarHeader'
import { SidebarContent } from './SidebarContent'

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-sidebar-background text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-14' : 'w-64'
      )}
    >
      <SidebarHeader />
      <SidebarContent />
    </aside>
  )
}
