import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { getColorHex } from '@/lib/colors'
import type { EChartsOption } from 'echarts'

// Axis name colors by role
const INPUT_AXIS_COLOR = '#38bdf8'   // sky-400
const OUTPUT_AXIS_COLOR = '#fbbf24'  // amber-400

export function useChartOption(theme: 'light' | 'dark'): EChartsOption | null {
  const rawData = useAppStore((s) => s.rawData)
  const columns = useAppStore((s) => s.columns)
  const colorMetricKey = useAppStore((s) => s.colorMetricKey)
  const selectedDesignId = useAppStore((s) => s.selectedDesignId)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)

  return useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) return null

    const numericCols = columns.filter((c) => c.type === 'number')
    if (numericCols.length === 0) return null

    // Find color metric column for value-based coloring
    const colorCol = colorMetricKey
      ? numericCols.find((c) => c.key === colorMetricKey)
      : null

    const textColor = theme === 'dark' ? '#94a3b8' : '#64748b'

    // Find the index where outputs start (for the visual separator)
    const firstOutputIdx = numericCols.findIndex((c) => c.role === 'output')

    const parallelAxis = numericCols.map((col, i) => ({
      dim: i,
      name: col.label,
      min: col.min,
      max: col.max,
      nameTextStyle: {
        color: col.role === 'output' ? OUTPUT_AXIS_COLOR : INPUT_AXIS_COLOR,
        fontSize: 11,
        fontWeight: 'bold' as const,
      },
      axisLine: {
        lineStyle: {
          color: col.role === 'output'
            ? 'rgba(251,191,36,0.35)'
            : 'rgba(56,189,248,0.35)',
        },
      },
      axisLabel: {
        color: textColor,
        fontSize: 10,
      },
    }))

    const seriesData = rawData.map((row) => {
      const values = numericCols.map((col) => row[col.key] as number)

      let lineColor: string
      if (colorCol && colorCol.min != null && colorCol.max != null) {
        lineColor = getColorHex(
          row[colorCol.key] as number,
          colorCol.min,
          colorCol.max
        )
      } else {
        lineColor = theme === 'dark' ? '#94a3b8' : '#64748b'
      }

      return {
        value: values,
        lineStyle: {
          color: lineColor,
          opacity: 0.55,
          width: 1.5,
        },
      }
    })

    // Build visual separating line between input and output sections
    const markLine = firstOutputIdx > 0
      ? {
          graphic: [
            {
              type: 'line' as const,
              shape: { x1: 0, y1: 0, x2: 0, y2: 1 },
              // Position will be approximate; ECharts doesn't natively support this
              // We'll use a text label instead
            },
            {
              type: 'text' as const,
              left: `${((firstOutputIdx - 0.5) / (numericCols.length - 1)) * 100}%`,
              top: 8,
              style: {
                text: '|',
                fill: theme === 'dark' ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.2)',
                fontSize: 20,
                fontWeight: 'bold' as const,
              },
            },
          ],
        }
      : {}

    const option: EChartsOption = {
      backgroundColor: 'transparent',
      parallelAxis,
      parallel: {
        left: 60,
        right: 60,
        top: 50,
        bottom: 30,
        parallelAxisDefault: {
          type: 'value',
          nameLocation: 'start',
          nameGap: 20,
          axisLabel: {
            color: textColor,
            fontSize: 10,
          },
          axisLine: {
            lineStyle: { color: theme === 'dark' ? '#334155' : '#cbd5e1' },
          },
        },
      },
      series: [
        {
          type: 'parallel',
          lineStyle: { width: 1.5, opacity: 0.5 },
          data: seriesData,
          smooth: false,
          inactiveOpacity: 0.04,
          activeOpacity: 0.55,
          z: 1,
        },
        // Highlight series: renders selected design on top with bright thick line
        ...(selectedDesignId
          ? (() => {
              const idx = rawData.findIndex((d) => d.id === selectedDesignId)
              if (idx < 0) return []
              const row = rawData[idx]
              const values = numericCols.map((col) => row[col.key] as number)
              const highlightColor = theme === 'dark' ? '#ffffff' : '#0f172a'
              return [
                {
                  type: 'parallel' as const,
                  lineStyle: { width: 3, opacity: 1 },
                  data: [
                    {
                      value: values,
                      lineStyle: {
                        color: highlightColor,
                        opacity: 1,
                        width: 3,
                        shadowColor: highlightColor,
                        shadowBlur: 6,
                      },
                    },
                  ],
                  smooth: false,
                  silent: true,
                  z: 2,
                },
              ]
            })()
          : []),
      ],
      ...markLine,
    }

    return option
  }, [rawData, columns, colorMetricKey, selectedDesignId, isDataLoaded, theme])
}
