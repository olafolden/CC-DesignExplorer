import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent />
    </div>
  )
}
