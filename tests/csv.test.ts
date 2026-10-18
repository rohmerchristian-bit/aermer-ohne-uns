import { describe, expect, it } from 'vitest';
import { parseCsv } from '../src/lib/csv.ts';

describe('parseCsv', () => {
  it('handles quotes, commas, escaped quotes and line breaks', () => {
    const csv = 'a,b,c\r\n"x, y","sagt ""hallo""","Zeile 1\nZeile 2"\r\n';
    expect(parseCsv(csv)).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'sagt "hallo"', 'Zeile 1\nZeile 2'],
    ]);
  });

  it('strips a BOM and skips empty lines', () => {
    expect(parseCsv('﻿a,b\n\n1,2\n,\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('rejects unterminated quotes with a German message', () => {
    expect(() => parseCsv('a,"b\n')).toThrow(/Anführungszeichen/);
  });
});
