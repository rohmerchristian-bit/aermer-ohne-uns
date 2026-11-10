import { describe, expect, it } from 'vitest';
import { demoActive } from '../src/lib/demo.ts';

describe('demoActive', () => {
  it('is on up to the end of the rally day (Berlin time)', () => {
    expect(demoActive(new Date('2026-11-18T23:59:00+01:00'))).toBe(true);
  });

  it('is off from the next day', () => {
    expect(demoActive(new Date('2026-11-19T00:00:00+01:00'))).toBe(false);
  });
});
