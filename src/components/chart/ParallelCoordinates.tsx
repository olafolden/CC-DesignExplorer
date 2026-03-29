import ReactECharts from 'echarts-for-react'
import { useAppStore } from '@/store'
import { useChartOption } from './useChartOption'
import { useChartEvents } from './useChartEvents'

export function ParallelCoordinates() {
  const theme = useAppStore((s) => s.theme)
  const option = useChartOption(theme)
  const { onEvents } = useChartEvents()

  if (!option) return null

  return (
    <ReactECharts
      option={option}
      onEvents={onEvents}
      style={{ height: '100%', width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
      theme={theme === 'dark' ? 'dark' : undefined}
      opts={{ renderer: 'canvas' }}
    />
  )
}
