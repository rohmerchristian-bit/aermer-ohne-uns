import type { Institution } from '../data/types.ts';

/** Small source note under an amount: where the number comes from. */
export function amountSourceLabel(inst: Pick<Institution, 'amount' | 'amountKind' | 'amountSource'>): string | null {
  if (inst.amount === null) return null;
  if (inst.amountKind === 'verified') return inst.amountSource ? `Quelle: ${inst.amountSource}` : 'Vom Bündnis geprüft';
  return 'Angabe der Einrichtung';
}
