import { describe, expect, it } from 'vitest';
import { getTemplate, templates, type Fields } from '../src/scripts/social/templates.ts';
import { safeName } from '../src/scripts/social/save.ts';

const empty: Fields = {
  area: 'kultur', kicker: '', title: '', subtitle: '', year: '', amount: '', quote: '', text: '',
  image: '', credit: '', stamp: '', source: '', cta: '', logo: '', editorial: '',
};
const assets = { logo: '/brand/logo.png' };

describe('social templates', () => {
  it('offers the four approved layouts per format', () => {
    expect(templates.filter((t) => t.format === 'post').map((t) => t.id)).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(templates.filter((t) => t.format === 'story').map((t) => t.id)).toEqual(['S1', 'S2', 'S3', 'S4']);
  });

  it('marks editorial entries with the grey design and the tab', () => {
    for (const id of ['P1', 'P2', 'P3', 'S1', 'S2']) {
      const html = getTemplate(id).render({ ...empty, editorial: '1', year: 'ab 2028', amount: '−24.000 €' }, assets);
      expect(html).toContain('is-editorial');
      expect(html).toContain('Redaktioneller Eintrag');
      expect(html).not.toContain('im Jahr ab');
    }
    expect(getTemplate('P1').render(empty, assets)).not.toContain('is-editorial');
  });

  it('renders every template with empty fields', () => {
    for (const tpl of templates) expect(tpl.render(empty, assets)).toContain('class="art');
  });

  it('escapes everything typed into the fields', () => {
    const evil = '<img src=x onerror=alert(1)>';
    for (const tpl of templates) {
      const html = tpl.render({ ...empty, title: evil, quote: evil, text: evil, kicker: evil, area: '"><b>' }, assets);
      expect(html).not.toContain('<img src=x');
      expect(html).not.toContain('"><b>');
    }
  });

  it('keeps short hyphenated words together and line breaks as typed', () => {
    const html = getTemplate('P1').render({ ...empty, title: 'Kulturzentrum E-Werk\nErlangen' }, assets);
    expect(html).toContain('<span class="nowrap">E-Werk</span><br>Erlangen');
  });

  it('hides optional parts that are left empty', () => {
    const html = getTemplate('P1').render({ ...empty, title: 'A', amount: '−1 €' }, assets);
    expect(html).not.toContain('yeartab');
    expect(html).not.toContain('class="foot"');
  });
});

describe('safeName', () => {
  it('makes names safe for Drive and Windows folders', () => {
    expect(safeName('Kulturzentrum E-Werk – Jugendtreff Fuxx')).toBe('Kulturzentrum E-Werk – Jugendtreff Fuxx');
    expect(safeName('a/b\\c:d*e?"f"<g>|h')).toBe('a b c d e f g h');
    expect(safeName('   ')).toBe('Ohne Titel');
  });
});
