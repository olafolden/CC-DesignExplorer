import { useCallback, useRef } from 'react'
import { useAppStore } from '@/store'
import type { BrushRange } from '@/store/types'

export function useChartEvents() {
  const columns = useAppStore((s) => s.columns)
  const setBrushRanges = useAppStore((s) => s.setBrushRanges)
  const setSelectedDesignId = useAppStore((s) => s.setSelectedDesignId)
  const rawData = useAppStore((s) => s.rawData)

  const rafId = useRef<number>(0)

  const numericCols = columns.filter((c) => c.type === 'number')

  const handleAxisAreaSelected = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params: any) => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axisArrays: any[] = params.currentSelections || []
        const ranges: BrushRange[] = []

        for (const sel of axisArrays) {
          const axisIndex = sel.axisIndex as number
          const intervals = sel.intervals as [number, number][]
          const col = numericCols[axisIndex]
          if (!col) continue

          for (const interval of intervals) {
            ranges.push({
              axisIndex,
              key: col.key,
              range: interval,
            })
          }
        }

        setBrushRanges(ranges)
      })
    },
    [numericCols, setBrushRanges]
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
      axisareaselected: handleAxisAreaSelected,
      click: handleClick,
    },
  }
}
