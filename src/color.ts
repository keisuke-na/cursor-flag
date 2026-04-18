export interface Hsl { h: number; s: number; l: number }

export function textToHue(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ((hash % 360) + 360) % 360
}

export function hexToHsl(hex: string): Hsl {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let s = 0
  let h = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function resolveColors(rule: { text: string; color?: string }): { bg: Hsl; fg: Hsl } {
  const bg = rule.color ? hexToHsl(rule.color) : { h: textToHue(rule.text), s: 70, l: 45 }
  const fg = { h: bg.h, s: bg.s, l: bg.l < 50 ? 95 : 10 }
  return { bg, fg }
}

export function toHsl(c: Hsl, alpha?: number): string {
  return alpha != null ? `hsla(${c.h},${c.s}%,${c.l}%,${alpha})` : `hsl(${c.h},${c.s}%,${c.l}%)`
}