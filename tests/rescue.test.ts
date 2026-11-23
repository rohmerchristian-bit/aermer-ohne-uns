import { describe, expect, it } from 'vitest';
import { parseRescue, rescueCovers } from '../src/lib/rescue.ts';

describe('rescue status', () => {
  it('reads the four dropdown values', () => {
    expect(parseRescue('vorläufig gerettet')).toBe('provisional');
    expect(parseRescue('Gerettet bis 2027')).toBe('until2027');
    expect(parseRescue('gerettet bis 2029')).toBe('until2029');
    expect(parseRescue('Von der Liste entfernt')).toBe('removed');
    expect(parseRescue('  ')).toBeNull();
    expect(parseRescue('irgendwas')).toBeUndefined();
  });

  it('strikes the amount only for the years that are safe', () => {
    expect(rescueCovers('provisional', 2027)).toBe(false);
    expect(rescueCovers('until2027', 2027)).toBe(true);
    expect(rescueCovers('until2027', 2028)).toBe(false);
    expect(rescueCovers('until2029', 2028)).toBe(true);
    expect(rescueCovers('removed', 2029)).toBe(true);
    expect(rescueCovers(null, 2027)).toBe(false);
  });
});
