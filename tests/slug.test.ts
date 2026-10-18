import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from '../src/lib/slug.ts';

describe('slugify', () => {
  it('transliterates German umlauts and ß', () => {
    expect(slugify('Bürgerhaus Süd')).toBe('buergerhaus-sued');
    expect(slugify('Ökologische Straße')).toBe('oekologische-strasse');
    expect(slugify('ÄRZTE & MÄUSE')).toBe('aerzte-und-maeuse');
  });

  it('removes other accents and punctuation', () => {
    expect(slugify('Café „Begegnung“ e. V.')).toBe('cafe-begegnung-e-v');
    expect(slugify('E-Werk Kulturzentrum GmbH')).toBe('e-werk-kulturzentrum-gmbh');
  });

  it('limits the length at a word boundary', () => {
    const slug = slugify('Gemeinnütziger Stadtteil- und Begegnungsverein Erlangen-Bruck-Anger mit Seniorentreff');
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('never returns an empty slug', () => {
    expect(slugify('!!!')).toBe('einrichtung');
  });
});

describe('uniqueSlug', () => {
  it('appends numbers to duplicates', () => {
    const taken = new Set<string>();
    expect(uniqueSlug('Jugendhaus Ost', taken)).toBe('jugendhaus-ost');
    expect(uniqueSlug('Jugendhaus Ost', taken)).toBe('jugendhaus-ost-2');
    expect(uniqueSlug('Jugendhaus  OST', taken)).toBe('jugendhaus-ost-3');
  });
});
