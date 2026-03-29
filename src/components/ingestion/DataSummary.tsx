import { Database, Columns3, Hash } from 'lucide-react'
import { useAppStore } from '@/store'

export function DataSummary() {
  const rawData = useAppStore((s) => s.rawData)
  const columns = useAppStore((s) => s.columns)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)

  if (!isDataLoaded) return null

  const numericCols = columns.filter((c) => c.type === 'number').length
  const stringCols = columns.length - numericCols

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-2 text-xs text-foreground">
        <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">{rawData.length}</span>
        <span className="text-muted-foreground">designs</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-foreground">
        <Columns3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">{columns.length}</span>
        <span className="text-muted-foreground">parameters</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Hash className="h-3.5 w-3.5 shrink-0" />
        <span>{numericCols} numeric, {stringCols} categorical</span>
      </div>
    </div>
  )
}
