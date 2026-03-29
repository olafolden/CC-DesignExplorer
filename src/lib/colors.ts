function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function getColorHex(value: number, min: number, max: number): string {
  if (max === min) return '#6b7280'
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const hue = (1 - t) * 220
  return hslToHex(hue, 75, 50)
}

export function createColorScale(min: number, max: number) {
  return (value: number) => getColorHex(value, min, max)
}
