import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'
import { useColorScale } from '@/hooks/useColorScale'

export function DesignInfo() {
  const selectedDesignId = useAppStore((s) => s.selectedDesignId)
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const colorMetricKey = useAppStore((s) => s.colorMetricKey)
  const colorScale = useColorScale()

  const { data: datasetResponse } = useDataset(currentDatasetId)
  const rawData = datasetResponse?.data ?? []
  const columns = datasetResponse?.columns ?? []

  if (!selectedDesignId) return null

  const row = rawData.find((d) => d.id === selectedDesignId)
  if (!row) return null

  const inputs = columns.filter((c) => c.type === 'number' && c.role === 'input')
  const outputs = columns.filter((c) => c.type === 'number' && c.role === 'output')

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium truncate">{selectedDesignId}</p>
        {colorMetricKey && colorScale && (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: colorScale.getColorForValue(
                row[colorMetricKey] as number
              ),
            }}
          />
        )}
      </div>

      {inputs.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-sky-400">Inputs</p>
          {inputs.map((col) => (
            <div key={col.key} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground truncate mr-2">{col.label}</span>
              <span className="font-mono tabular-nums">
                {typeof row[col.key] === 'number'
                  ? (row[col.key] as number).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  : row[col.key]}
              </span>
            </div>
          ))}
        </div>
      )}

      {outputs.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-amber-400">Outputs</p>
          {outputs.map((col) => {
            const isColorMetric = col.key === colorMetricKey
            return (
              <div key={col.key} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate mr-2">{col.label}</span>
                <span className="font-mono tabular-nums flex items-center gap-1">
                  {isColorMetric && colorScale && (
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: colorScale.getColorForValue(
                          row[col.key] as number
                        ),
                      }}
                    />
                  )}
                  {typeof row[col.key] === 'number'
                    ? (row[col.key] as number).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : row[col.key]}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
