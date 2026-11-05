import { describe, expect, it } from 'vitest';
import { amountSourceLabel, percentLabel } from '../src/lib/amount-label.ts';

describe('percentLabel', () => {
  it('reads percentages with a sign or word', () => {
    expect(percentLabel('10 %')).toBe('Kürzung um 10 %');
    expect(percentLabel('Kürzung um 12,5 Prozent')).toBe('Kürzung um 12,5 %');
  });

  it('reads a bare number as a percentage', () => {
    expect(percentLabel('11')).toBe('Kürzung um 11 %');
    expect(percentLabel(' 50 ')).toBe('Kürzung um 50 %');
    expect(percentLabel('-7,5')).toBe('Kürzung um 7,5 %');
  });

  it('keeps other free text as written', () => {
    expect(percentLabel('vollständige Streichung')).toBe('vollständige Streichung');
    expect(percentLabel(null)).toBeNull();
  });
});

describe('amountSourceLabel', () => {
  it('credits the alliance for city entries', () => {
    const reported = { amount: 1000, amountKind: 'reported' as const, amountSource: null };
    expect(amountSourceLabel(reported)).toBe('Angabe der Einrichtung');
    expect(amountSourceLabel({ ...reported, cityEntry: true })).toBe('Angabe des Bündnisses');
  });
});
