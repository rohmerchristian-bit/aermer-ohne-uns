import { describe, expect, it } from 'vitest';
import { parseAmount } from '../src/lib/amount.ts';

const value = (raw: string) => {
  const r = parseAmount(raw);
  return r.ok ? r.value : null;
};

describe('parseAmount', () => {
  it.each([
    ['25.000 €', 25000],
    ['25.000,00', 25000],
    ['25000', 25000],
    ['25 000 €', 25000],
    ['ca. 25 Tsd.', 25000],
    ['ca. 25 Tsd. €', 25000],
    ['25 T€', 25000],
    ['25k', 25000],
    ['25,5 Tsd', 25500],
    ['1,2 Mio. €', 1200000],
    ['1.5 Mio', 1500000],
    ['€ 18.500,-', 18500],
    ['18.500 Euro pro Jahr', 18500],
    ['EUR 7.250', 7250],
    ['rund 130.000 €', 130000],
    ['1.250.000', 1250000],
    ['-45.000 €', 45000],
    ['−45.000 €', 45000],
    ['999,60', 1000],
  ])('reads %s', (raw, expected) => {
    expect(value(raw)).toBe(expected);
  });

  it.each(['weiß noch nicht genau', '20.000–30.000 €', '20.000 bis 30.000', '1,250.00', '12.34.56', 'k.A.', '0', 'ca.'])(
    'rejects %s as unreadable',
    (raw) => {
      expect(parseAmount(raw)).toEqual({ ok: false, reason: 'unreadable' });
    },
  );

  it('reports empty values separately', () => {
    expect(parseAmount('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseAmount('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(parseAmount(undefined)).toEqual({ ok: false, reason: 'empty' });
  });
});
