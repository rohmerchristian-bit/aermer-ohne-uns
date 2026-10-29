import { describe, expect, it } from 'vitest';
import { formatCompact, formatCut, formatEuro, initials, instagramHandle, truncate } from '../src/lib/format';

const NBSP = '\u00A0';

describe('formatEuro / formatCut / formatCompact', () => {
  it('formats German euro amounts with a non-breaking space', () => {
    expect(formatEuro(45000)).toBe(`45.000${NBSP}€`);
    expect(formatEuro(1250000)).toBe(`1.250.000${NBSP}€`);
  });

  it('rounds to whole euros', () => {
    expect(formatEuro(999.6)).toBe(`1.000${NBSP}€`);
  });

  it('uses a real minus sign for cuts', () => {
    expect(formatCut(45000)).toBe(`\u221245.000${NBSP}€`);
    expect(formatCut(-45000)).toBe(`\u221245.000${NBSP}€`);
  });

  it('shortens millions', () => {
    expect(formatCompact(1_200_000)).toBe(`1,2${NBSP}Mio.${NBSP}€`);
    expect(formatCompact(10_800_000)).toBe(`10,8${NBSP}Mio.${NBSP}€`);
    expect(formatCompact(85_000)).toBe(`85.000${NBSP}€`);
  });
});

describe('truncate', () => {
  it('leaves short text alone and normalises whitespace', () => {
    expect(truncate('  kurz   und gut ', 50)).toBe('kurz und gut');
  });

  it('cuts at a word boundary and adds an ellipsis', () => {
    const result = truncate('Die Reihe für Grundschulen müsste eingestellt werden.', 30);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toBe('Die Reihe für Grundschulen…');
  });
});

describe('initials', () => {
  it('takes up to two capitalised words', () => {
    expect(initials('E-Werk Kulturzentrum')).toBe('EW');
    expect(initials('Theater am Fluss')).toBe('TF');
    expect(initials('Ärztehaus Mitte')).toBe('ÄM');
  });
});

describe('instagramHandle', () => {
  it('reads the profile name from the URL, with or without tracking parameters', () => {
    expect(instagramHandle('https://www.instagram.com/aermer.ohne.uns/')).toBe('@aermer.ohne.uns');
    expect(instagramHandle('https://www.instagram.com/aermer.ohne.uns?srtk=abc')).toBe('@aermer.ohne.uns');
    expect(instagramHandle('https://example.org/')).toBeNull();
  });
});
