// Parses German euro amounts as people type them into a form:
// "25.000 €", "25.000,00", "25000", "ca. 25 Tsd.", "1,2 Mio. €", "€ 18.500,-", "25k".
// Returns null when the value is empty or cannot be read unambiguously.

export type AmountResult = { ok: true; value: number } | { ok: false; reason: 'empty' | 'unreadable' };

const MULTIPLIERS: Array<[RegExp, number]> = [
  [/(mio\.?|millionen?|mill\.?)/i, 1_000_000],
  [/(tsd\.?|tausend|t€|teur|k)\b|t\s*€/i, 1_000],
];

export function parseAmount(raw: string | undefined | null): AmountResult {
  let text = (raw ?? '').trim();
  if (text === '') return { ok: false, reason: 'empty' };

  text = text
    .toLowerCase()
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/^(ca\.?|circa|rund|etwa|ungefähr|ungef\.|bis zu|mind\.?|mindestens|über|ueber|~)\s*/i, '')
    .replace(/,[\u2212–-]+$/, '') // "18.500,-"
    .trim();

  // Ranges like "20.000–30.000" are ambiguous.
  if (/\d\s*[–-]\s*\d/.test(text) || /\bbis\b/.test(text)) return { ok: false, reason: 'unreadable' };

  let multiplier = 1;
  for (const [pattern, factor] of MULTIPLIERS) {
    if (pattern.test(text)) {
      multiplier = factor;
      text = text.replace(pattern, ' ');
      break;
    }
  }

  text = text
    .replace(/€|eur(o|os)?\b/g, ' ')
    .replace(/pro\s+jahr|\/\s*jahr|jährlich|p\.\s*a\.?/g, ' ')
    .replace(/^[\u2212-]/, '')
    .trim()
    .replace(/\s*[.,]+$/, ''); // leftovers such as "25 tsd." -> "25"

  // Only digits, separators and spaces may remain.
  if (!/^\d[\d.,' ]*$/.test(text)) return { ok: false, reason: 'unreadable' };
  text = text.replace(/[' ]/g, '');

  const value = toNumber(text);
  if (value === null || !Number.isFinite(value)) return { ok: false, reason: 'unreadable' };

  const result = Math.round(value * multiplier);
  if (result <= 0) return { ok: false, reason: 'unreadable' };
  return { ok: true, value: result };
}

function toNumber(text: string): number | null {
  const hasDot = text.includes('.');
  const hasComma = text.includes(',');

  if (hasDot && hasComma) {
    // German: 1.250.000,50 – dots group thousands, comma is decimal.
    if (text.lastIndexOf(',') < text.lastIndexOf('.')) return null; // English style – reject
    if (!/^\d{1,3}(\.\d{3})+,\d+$/.test(text)) return null;
    return Number(text.replace(/\./g, '').replace(',', '.'));
  }

  if (hasComma) {
    // German decimal comma: 25,5 / 1,2
    if (!/^\d+,\d+$/.test(text)) return null;
    return Number(text.replace(',', '.'));
  }

  if (hasDot) {
    // 25.000 or 1.250.000 → thousands separators; 1.5 → decimal (e.g. "1.5 Mio")
    if (/^\d{1,3}(\.\d{3})+$/.test(text)) return Number(text.replace(/\./g, ''));
    if (/^\d+\.\d{1,2}$/.test(text)) return Number(text);
    return null;
  }

  return Number(text);
}
