// Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, line breaks inside quotes),
// which is what Google Sheets' "publish to the web" produces.

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (inQuotes) throw new Error('CSV-Datei ist beschädigt: ein Anführungszeichen wird nicht geschlossen.');

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop completely empty lines (e.g. trailing newline, empty sheet rows).
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}
