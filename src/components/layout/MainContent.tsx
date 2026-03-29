import { Box, BarChart3 } from 'lucide-react'

export function MainContent() {
  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Viewer area */}
      <div className="flex flex-1 items-center justify-center border-b border-border bg-muted/30">
        <div className="text-center text-muted-foreground">
          <Box className="mx-auto mb-3 h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">2D / 3D Viewer</p>
          <p className="text-xs">Phase 5</p>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex h-[40vh] items-center justify-center bg-muted/10">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-3 h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">Parallel Coordinates Chart</p>
          <p className="text-xs">Phase 4</p>
        </div>
      </div>
    </main>
  )
}
