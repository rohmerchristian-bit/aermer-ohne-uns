// WCAG 2.1 relative luminance and contrast ratio helpers.

export const WCAG_AA_NORMAL = 4.5;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`Ungültiger Farbwert: "${hex}" (erwartet: #RRGGBB)`);
  const n = parseInt(match[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Returns whichever candidate has the higher contrast against the background. */
export function pickTextColor(background: string, candidates: readonly string[]): { color: string; ratio: number } {
  let best = { color: candidates[0]!, ratio: 0 };
  for (const color of candidates) {
    const ratio = contrastRatio(background, color);
    if (ratio > best.ratio) best = { color, ratio };
  }
  return best;
}
