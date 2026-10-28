import { describe, expect, it } from 'vitest';
import { contactEmail, contactPhone } from '../src/data/pipeline.ts';
import { findColumn } from '../src/data/columns.ts';

const collect = () => {
  const warnings: string[] = [];
  return { warnings, warn: (message: string) => warnings.push(message) };
};

describe('contact for questions', () => {
  it('accepts a plain e-mail address', () => {
    const { warnings, warn } = collect();
    expect(contactEmail(' info@verein-erlangen.de ', warn)).toBe('info@verein-erlangen.de');
    expect(contactEmail('', warn)).toBeNull();
    expect(warnings).toEqual([]);
  });

  it('drops anything that is not one address', () => {
    const { warnings, warn } = collect();
    expect(contactEmail('bitte über die Website', warn)).toBeNull();
    expect(contactEmail('a@b.de, c@d.de', warn)).toBeNull();
    expect(warnings).toHaveLength(2);
  });

  it('accepts usual phone formats and drops text', () => {
    const { warnings, warn } = collect();
    expect(contactPhone('0163-1815049', warn)).toBe('0163-1815049');
    expect(contactPhone('+49 (9131)  86 24 00', warn)).toBe('+49 (9131) 86 24 00');
    expect(contactPhone('09131 / 862400', warn)).toBe('09131 / 862400');
    expect(contactPhone('Mo–Fr erreichbar', warn)).toBeNull();
    expect(warnings).toHaveLength(1);
  });

  it('never mixes up the internal alliance e-mail with the public one', () => {
    expect(findColumn('E-Mail-Adresse für Rückfragen')?.visibility).toBe('public');
    expect(findColumn('E-Mail-Adresse für Rückfragen & Bündnisarbeit')?.visibility).toBe('private');
  });
});
