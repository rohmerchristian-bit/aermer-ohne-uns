import { describe, expect, it } from 'vitest';
import { normalize } from '../src/scripts/filter.ts';

describe('search normalisation', () => {
  it('treats umlauts, their ae/oe/ue spelling and plain vowels alike', () => {
    expect(normalize('Bürgerhaus')).toBe(normalize('Buergerhaus'));
    expect(normalize('Bürgerhaus')).toBe(normalize('burgerhaus'));
    expect(normalize('Straße')).toBe(normalize('STRASSE'));
    expect(normalize('Kürzung')).toContain(normalize('kuerz'));
  });
});
