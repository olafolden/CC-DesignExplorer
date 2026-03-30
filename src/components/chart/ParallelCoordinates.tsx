import { useRef, useEffect, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsType } from 'echarts'
import { useAppStore } from '@/store'
import { useChartOption } from './useChartOption'
import { useChartEvents } from './useChartEvents'

export function ParallelCoordinates() {
  const theme = useAppStore((s) => s.theme)
  const brushRanges = useAppStore((s) => s.brushRanges)
  const option = useChartOption(theme)
  const { onEvents } = useChartEvents()
  const instanceRef = useRef<EChartsType | null>(null)
  const prevBrushCountRef = useRef(0)

  const handleChartReady = useCallback((instance: EChartsType) => {
    instanceRef.current = instance
  }, [])

  // When brushRanges goes from non-empty to empty (i.e. "Clear all"), reset ECharts brushes
  useEffect(() => {
    const wasActive = prevBrushCountRef.current > 0
    prevBrushCountRef.current = brushRanges.length

    if (brushRanges.length === 0 && wasActive && instanceRef.current) {
      const instance = instanceRef.current
      try {
        const opt = instance.getOption() as { parallelAxis?: unknown[] }
        const axisCount = opt?.parallelAxis?.length ?? 0
        for (let i = 0; i < axisCount; i++) {
          instance.dispatchAction({
            type: 'axisAreaSelect',
            parallelAxisIndex: i,
            intervals: [],
          })
        }
      } catch {
        // Chart may be re-initializing, ignore
      }
    }
  }, [brushRanges])

  if (!option) return null

  return (
    <ReactECharts
      option={option}
      onEvents={onEvents}
      onChartReady={handleChartReady}
      style={{ height: '100%', width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
      opts={{ renderer: 'canvas' }}
    />
  )
}
