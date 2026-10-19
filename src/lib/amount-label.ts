import type { Project } from '../data/types.ts';

/** Small source note under an amount: where the number comes from. */
export function amountSourceLabel(p: Pick<Project, 'amount' | 'amountKind' | 'amountSource'>): string | null {
  if (p.amount === null) return null;
  if (p.amountKind === 'verified') return p.amountSource ? `Quelle: ${p.amountSource}` : 'Vom Bündnis geprüft';
  return 'Angabe der Einrichtung';
}

/** "Kürzung um 10 %" from free text like "10 %", "10%" or "Kürzung um 10 Prozent". */
export function percentLabel(raw: string | null): string | null {
  if (!raw) return null;
  const match = /(\d+(?:[.,]\d+)?)\s*(%|prozent)/i.exec(raw);
  return match ? `Kürzung um ${match[1]!.replace('.', ',')}\u00A0%` : raw;
}
