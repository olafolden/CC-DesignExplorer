import { Database, SlidersHorizontal, Target } from 'lucide-react'
import { useAppStore } from '@/store'

export function DataSummary() {
  const rawData = useAppStore((s) => s.rawData)
  const columns = useAppStore((s) => s.columns)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)

  if (!isDataLoaded) return null

  const inputCols = columns.filter((c) => c.role === 'input').length
  const outputCols = columns.filter((c) => c.role === 'output').length

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-2 text-xs text-foreground">
        <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">{rawData.length}</span>
        <span className="text-muted-foreground">designs</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-sky-400" />
        <span className="font-medium text-sky-400">{inputCols}</span>
        <span className="text-muted-foreground">inputs</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Target className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span className="font-medium text-amber-400">{outputCols}</span>
        <span className="text-muted-foreground">outputs</span>
      </div>
    </div>
  )
}
