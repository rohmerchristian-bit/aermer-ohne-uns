// German number and text formatting. All amounts are euros per year.

const NBSP = ' ';
const MINUS = '−';

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const decimal1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

/** "45.000 €" (non-breaking space before the euro sign). */
export function formatEuro(amount: number): string {
  return euro.format(amount).replace(/\s/g, NBSP);
}

/** "−45.000 €" with a real minus sign, for cut amounts. */
export function formatCut(amount: number): string {
  return `${MINUS}${formatEuro(Math.abs(amount))}`;
}

/** "1,2 Mio. €" for large sums, otherwise the full amount. */
export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${decimal1.format(amount / 1_000_000)}${NBSP}Mio.${NBSP}€`;
  }
  return formatEuro(amount);
}

/** Shortens text at a word boundary and appends an ellipsis. */
export function truncate(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–-]+$/, '')}…`;
}

/** Up to two initials, e.g. "E-Werk Kulturzentrum" → "EK". */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && /\p{Lu}|\p{N}/u.test(w[0]!));
  const picked = (words.length > 0 ? words : name.split(/\s+/)).slice(0, 2);
  return picked.map((w) => w[0]!.toUpperCase()).join('');
}
