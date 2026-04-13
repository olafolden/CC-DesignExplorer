import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { computeSunPath, type SunPathData } from '@/lib/sun-path'

export function useSunPath(): SunPathData | null {
  const sunPathEnabled = useAppStore((s) => s.viewerSettings.sunPathEnabled)
  const sunDate = useAppStore((s) => s.viewerSettings.sunDate)
  const sunTime = useAppStore((s) => s.viewerSettings.sunTime)
  const sunLatitude = useAppStore((s) => s.viewerSettings.sunLatitude)
  const sunLongitude = useAppStore((s) => s.viewerSettings.sunLongitude)

  return useMemo(() => {
    if (!sunPathEnabled) return null
    return computeSunPath(sunDate, sunTime, sunLatitude, sunLongitude)
  }, [sunPathEnabled, sunDate, sunTime, sunLatitude, sunLongitude])
}
