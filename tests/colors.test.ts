import { describe, expect, it } from 'vitest';
import { areaColors, base, signal, textCandidates } from '../src/design/colors';
import { areas } from '../src/data/areas';
import { contrastRatio, pickTextColor, WCAG_AA_NORMAL } from '../src/lib/contrast';

describe('colour tokens', () => {
  it('reaches WCAG AA for text on every area colour and the signal colour', () => {
    for (const [name, hex] of [...Object.entries(areaColors), ['signal', signal]]) {
      const { ratio } = pickTextColor(hex, textCandidates);
      expect(ratio, `${name} ${hex}`).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    }
  });

  it('reaches WCAG AA for muted text on paper', () => {
    expect(contrastRatio(base.muted, base.paper)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  it('keeps the signal colour out of the area palette', () => {
    expect(Object.values(areaColors).map((c) => c.toLowerCase())).not.toContain(signal.toLowerCase());
  });

  it('has a distinct colour for each of the seven areas', () => {
    expect(areas).toHaveLength(7);
    expect(new Set(areas.map((a) => a.color.toLowerCase())).size).toBe(7);
  });

  it('computes known contrast ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});
