import { useCallback, useRef } from 'react'
import type { EChartsType } from 'echarts'
import { useAppStore } from '@/store'
import { useDataset } from '@/hooks/queries/use-dataset'
import type { BrushRange } from '@/store/types'

export function useChartEvents() {
  const currentDatasetId = useAppStore((s) => s.currentDatasetId)
  const setBrushRanges = useAppStore((s) => s.setBrushRanges)
  const setSelectedDesignId = useAppStore((s) => s.setSelectedDesignId)

  const parameterSettings = useAppStore((s) => s.parameterSettings)

  const { data: datasetResponse } = useDataset(currentDatasetId)
  const rawData = datasetResponse?.data ?? []
  const columns = datasetResponse?.columns ?? []

  const rafId = useRef<number>(0)

  const numericCols = columns.filter((c) => c.type === 'number')
  const visibleCols = numericCols.filter(
    (c) => parameterSettings[c.key]?.isVisible !== false
  )

  const handleAxisAreaSelected = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_params: any, instance: EChartsType) => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        const ranges: BrushRange[] = []

        // Query each parallel axis model for its active intervals
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opt = instance.getOption() as any
        const parallelAxes = opt.parallelAxis || []

        for (let i = 0; i < parallelAxes.length; i++) {
          const col = visibleCols[i]
          if (!col) continue

          // Get the axis model to read activeIntervals
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const axisModel = (instance as any).getModel()?.getComponent('parallelAxis', i)
          const intervals: [number, number][] = axisModel?.activeIntervals || []

          for (const interval of intervals) {
            ranges.push({
              axisIndex: i,
              key: col.key,
              range: interval,
            })
          }
        }

        setBrushRanges(ranges)
      })
    },
    [visibleCols, setBrushRanges]
  )

  const handleClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params: any) => {
      if (params.dataIndex != null && rawData[params.dataIndex]) {
        setSelectedDesignId(rawData[params.dataIndex].id)
      }
    },
    [rawData, setSelectedDesignId]
  )

  return {
    onEvents: {
      axisAreaSelected: handleAxisAreaSelected,
      click: handleClick,
    },
  }
}
