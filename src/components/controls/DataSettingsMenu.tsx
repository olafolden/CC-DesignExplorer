'use client'

import { Settings2, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ColumnMeta } from '@/types/design'

function ParameterRow({ col }: { col: ColumnMeta }) {
  const settings = useAppStore((s) => s.parameterSettings[col.key])
  const setParameterVisible = useAppStore((s) => s.setParameterVisible)
  const setParameterBounds = useAppStore((s) => s.setParameterBounds)
  const setParameterStepCount = useAppStore((s) => s.setParameterStepCount)

  const isVisible = settings?.isVisible !== false
  const customMin = settings?.customMin ?? ''
  const customMax = settings?.customMax ?? ''
  const stepCount = settings?.stepCount ?? 5

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span
        className="text-xs font-medium truncate min-w-0 flex-1"
        title={col.label}
      >
        {col.label}
      </span>
      <Switch
        size="sm"
        checked={isVisible}
        onCheckedChange={(checked) => setParameterVisible(col.key, checked)}
        aria-label={`Toggle ${col.label} visibility`}
      />
      <input
        type="number"
        className="h-6 w-14 rounded border border-input bg-background px-1.5 text-xs tabular-nums disabled:opacity-40"
        placeholder={col.min != null ? String(col.min) : '—'}
        value={customMin}
        disabled={!isVisible}
        onChange={(e) => {
          const val = e.target.value === '' ? null : Number(e.target.value)
          setParameterBounds(col.key, val, settings?.customMax ?? null)
        }}
        aria-label={`${col.label} min`}
      />
      <input
        type="number"
        className="h-6 w-14 rounded border border-input bg-background px-1.5 text-xs tabular-nums disabled:opacity-40"
        placeholder={col.max != null ? String(col.max) : '—'}
        value={customMax}
        disabled={!isVisible}
        onChange={(e) => {
          const val = e.target.value === '' ? null : Number(e.target.value)
          setParameterBounds(col.key, settings?.customMin ?? null, val)
        }}
        aria-label={`${col.label} max`}
      />
      <input
        type="number"
        className="h-6 w-12 rounded border border-input bg-background px-1.5 text-xs tabular-nums disabled:opacity-40"
        value={stepCount}
        min={1}
        max={20}
        disabled={!isVisible}
        onChange={(e) => {
          const val = Number(e.target.value)
          if (val >= 1 && val <= 20) setParameterStepCount(col.key, val)
        }}
        aria-label={`${col.label} steps`}
      />
    </div>
  )
}

export function DataSettingsMenu() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const resetParameterSettings = useAppStore((s) => s.resetParameterSettings)
  const { data: datasetResponse } = useDataset(currentDatasetId)

  const columns = datasetResponse?.columns ?? []
  const rowCount = datasetResponse?.data?.length ?? 0
  const numericCols = columns.filter((c) => c.type === 'number')
  const inputCols = numericCols.filter((c) => c.role === 'input')
  const outputCols = numericCols.filter((c) => c.role === 'output')

  if (numericCols.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Data settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end" side="bottom">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs text-muted-foreground">
            {rowCount} designs · {inputCols.length} inputs · {outputCols.length} outputs
          </p>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="px-3 py-2">
            {/* Column headers */}
            <div className="flex items-center gap-2 pb-1 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 flex-1">Parameter</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-[30px] text-center">Vis</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-14 text-center">Min</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-14 text-center">Max</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-12 text-center">Steps</span>
            </div>

            {inputCols.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-400 mt-1 mb-0.5">
                  Inputs
                </p>
                {inputCols.map((col) => (
                  <ParameterRow key={col.key} col={col} />
                ))}
              </>
            )}

            {outputCols.length > 0 && (
              <>
                {inputCols.length > 0 && <Separator className="my-2" />}
                <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 mt-1 mb-0.5">
                  Outputs
                </p>
                {outputCols.map((col) => (
                  <ParameterRow key={col.key} col={col} />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
        <div className="px-3 py-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => resetParameterSettings()}
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Reset all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
