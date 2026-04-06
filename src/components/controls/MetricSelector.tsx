import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function MetricSelector() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const colorMetricKey = useAppStore((s) => s.colorMetricKey)
  const setColorMetricKey = useAppStore((s) => s.setColorMetricKey)

  const { data: datasetResponse, isSuccess: isDataLoaded } = useDataset(currentDatasetId)
  const columns = datasetResponse?.columns ?? []

  const numericCols = columns.filter((c) => c.type === 'number')
  const inputs = numericCols.filter((c) => c.role === 'input')
  const outputs = numericCols.filter((c) => c.role === 'output')

  if (!isDataLoaded || numericCols.length === 0) return null

  return (
    <Select value={colorMetricKey ?? ''} onValueChange={setColorMetricKey}>
      <SelectTrigger size="sm" className="w-full text-xs">
        <SelectValue placeholder="Color by..." />
      </SelectTrigger>
      <SelectContent>
        {inputs.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-sky-400">Inputs</SelectLabel>
            {inputs.map((col) => (
              <SelectItem key={col.key} value={col.key}>
                {col.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {inputs.length > 0 && outputs.length > 0 && <SelectSeparator />}
        {outputs.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-amber-400">Outputs</SelectLabel>
            {outputs.map((col) => (
              <SelectItem key={col.key} value={col.key}>
                {col.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  )
}
