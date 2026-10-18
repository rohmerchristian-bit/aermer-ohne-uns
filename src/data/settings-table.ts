import { normalizeHeader } from './columns.ts';

export interface KeyValueRow {
  key: string;
  value: string;
  line: number;
}

/**
 * Reads a two-column key/value sheet. Uses the columns titled "Schlüssel" and "Wert";
 * falls back to the first two columns if those titles are missing.
 */
export function readKeyValueRows(table: string[][], warn: (msg: string) => void): KeyValueRow[] {
  const [header, ...rows] = table;
  if (!header) return [];

  const titles = header.map(normalizeHeader);
  let keyIndex = titles.findIndex((t) => t === 'schlüssel' || t === 'schluessel');
  let valueIndex = titles.findIndex((t) => t === 'wert');
  if (keyIndex === -1 || valueIndex === -1) {
    warn('Blatt „Einstellungen“: Spalten „Schlüssel“ und „Wert“ nicht gefunden – es werden die ersten beiden Spalten verwendet.');
    keyIndex = 0;
    valueIndex = 1;
  }

  return rows
    .map((row, i) => ({
      key: (row[keyIndex] ?? '').trim().toLowerCase(),
      value: (row[valueIndex] ?? '').trim(),
      line: i + 2,
    }))
    .filter((r) => r.key !== '');
}
