import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { fitFontSize, OG_HEIGHT, OG_WIDTH, organisationImage, pageImage } from '../src/lib/og.ts';

describe('share images', () => {
  it('chooses smaller font sizes for longer titles', () => {
    const sizes: Array<[number, number]> = [[10, 100], [20, 80]];
    expect(fitFontSize('kurz', sizes, 50)).toBe(100);
    expect(fitFontSize('etwas länger', sizes, 50)).toBe(80);
    expect(fitFontSize('ein deutlich längerer Titel', sizes, 50)).toBe(50);
  });

  it('renders a page image as a 1200 × 630 PNG', async () => {
    const png = await pageImage({ kicker: 'Hintergrund', title: 'Worum es geht', text: 'Umlaute: ä ö ü ß – „Zitat“ −45.000 €' });
    const meta = await sharp(png).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['png', OG_WIDTH, OG_HEIGHT]);
  }, 30_000);

  it('renders an organisation image with a very long name', async () => {
    const png = await organisationImage({
      name: 'Gemeinnütziger Stadtteil- und Begegnungsverein Erlangen-Bruck-Anger mit Seniorentreff und Sprachcafé',
      areas: 'Soziales, Familie & Senioren',
      background: '#FF6B00',
      foreground: '#111111',
      amount: '−132.000 €',
      summary: '2 betroffene Projekte · im Jahr 2027',
    });
    const meta = await sharp(png).metadata();
    expect([meta.width, meta.height]).toEqual([OG_WIDTH, OG_HEIGHT]);
  }, 30_000);
});
