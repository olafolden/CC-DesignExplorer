import SunCalc from 'suncalc'

export interface SunPathPoint {
  x: number
  y: number
  z: number
}

export interface SunPathData {
  sunPosition: SunPathPoint
  arcPoints: SunPathPoint[]
  sunAltitude: number
  sunAzimuth: number
}

/**
 * Convert solar altitude/azimuth to Three.js Y-up Cartesian coordinates.
 *
 * SunCalc convention: azimuth 0 = south, positive = west.
 * Three.js: Y = up, X = east, Z = south (right-handed).
 */
function toCartesian(altitude: number, azimuth: number, radius: number): SunPathPoint {
  return {
    x: -radius * Math.cos(altitude) * Math.sin(azimuth),
    y: radius * Math.sin(altitude),
    z: -radius * Math.cos(altitude) * Math.cos(azimuth),
  }
}

/**
 * Compute the sun's current position and daily arc path for a given date,
 * time, and geographic location.
 *
 * @param date  ISO date string, e.g. '2026-06-21'
 * @param time  Decimal hours 0-24, e.g. 14.5 = 2:30 PM
 * @param lat   Latitude in degrees (-90 to 90)
 * @param lng   Longitude in degrees (-180 to 180)
 * @param sceneRadius  Radius of the sun arc in scene units (default 5)
 */
export function computeSunPath(
  date: string,
  time: number,
  lat: number,
  lng: number,
  sceneRadius = 5,
): SunPathData {
  // Build Date from date string + decimal hours
  const dt = new Date(date)
  dt.setHours(Math.floor(time), Math.round((time % 1) * 60), 0, 0)

  // Current sun position
  const sunPos = SunCalc.getPosition(dt, lat, lng)
  const sunPosition = toCartesian(sunPos.altitude, sunPos.azimuth, sceneRadius)

  // Compute arc points for the full day (sunrise to sunset)
  const dayDate = new Date(date)
  dayDate.setHours(0, 0, 0, 0)
  const times = SunCalc.getTimes(dayDate, lat, lng)

  const arcPoints: SunPathPoint[] = []
  const sunrise = times.sunrise.getTime()
  const sunset = times.sunset.getTime()

  if (!isNaN(sunrise) && !isNaN(sunset) && sunset > sunrise) {
    const numPoints = 48
    const step = (sunset - sunrise) / numPoints

    for (let t = sunrise; t <= sunset; t += step) {
      const pos = SunCalc.getPosition(new Date(t), lat, lng)
      if (pos.altitude > 0) {
        arcPoints.push(toCartesian(pos.altitude, pos.azimuth, sceneRadius))
      }
    }
  }

  return {
    sunPosition,
    arcPoints,
    sunAltitude: sunPos.altitude,
    sunAzimuth: sunPos.azimuth,
  }
}
