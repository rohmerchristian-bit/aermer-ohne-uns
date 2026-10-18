// Turns the rows of the published "Öffentlich" sheet into public institution records.
//
// Privacy safety net: values are read ONLY through `read()`, which refuses every key that is
// not on the allowlist (src/data/columns.ts). Even if the sheet accidentally publishes private
// columns, they are never copied into the output.

import { areas, FALLBACK_AREA } from './areas.ts';
import { columns, findColumn, isChecked, isConsent, READABLE_KEYS, type ColumnKey } from './columns.ts';
import type { BuildMessage, ImageRef, Institution, PipelineEntry } from './types.ts';
import { parseAmount } from '../lib/amount.ts';
import { uniqueSlug } from '../lib/slug.ts';

export class DataError extends Error {
  /** Warnings collected before the error, so they can still be shown. */
  readonly messages: BuildMessage[];
  constructor(message: string, messages: BuildMessage[] = []) {
    super(message);
    this.messages = messages;
  }
}

export interface PipelineOptions {
  /** Allow image paths relative to data/sample/ (only for DATA_SOURCE=sample). */
  allowSampleImages: boolean;
}

export interface PipelineResult {
  entries: PipelineEntry[];
  messages: BuildMessage[];
  stats: { rows: number; published: number; notApproved: number; noConsent: number; invalid: number };
}

export function runPipeline(table: string[][], options: PipelineOptions): PipelineResult {
  const messages: BuildMessage[] = [];
  const warn = (message: string) => messages.push({ severity: 'warning', message });

  const [header, ...rows] = table;
  if (!header) throw new DataError('Die Tabelle „Öffentlich“ ist leer – es wurde keine Kopfzeile gefunden.');

  // Google Sheets formula errors (#REF!, #NAME?, #N/A, #VALUE!, #ERROR!) end up in the header row.
  const formulaError = header.find((h) => /^#(REF!|NAME\?|N\/A|VALUE!|ERROR!|DIV\/0!)/i.test(h.trim()));
  if (formulaError) {
    throw new DataError(
      `Die Formel im Blatt „Öffentlich“ liefert den Fehler „${formulaError.trim()}“. ` +
        'Meist stimmt der Name des Quellblatts nicht (z. B. „Formularantworten 1“ – dann in Anführungszeichen: \'Formularantworten 1\'!A:Y).',
    );
  }

  // Map column index -> key, allowlisted keys only.
  const indexOf = new Map<ColumnKey, number>();
  header.forEach((title, index) => {
    if (title.trim() === '') return;
    const column = findColumn(title);
    if (!column) {
      warn(`Unbekannte Spalte „${title.trim()}“ wird ignoriert. Falls ein Fragetitel geändert wurde: src/data/columns.ts anpassen.`);
      return;
    }
    if (!READABLE_KEYS.has(column.key)) {
      warn(
        `Das Blatt „Öffentlich“ enthält die private Spalte „${column.header}“. Sie wird NICHT veröffentlicht – bitte die Formel im Sheet korrigieren.`,
      );
      return;
    }
    if (indexOf.has(column.key)) {
      warn(`Die Spalte „${column.header}“ kommt doppelt vor; verwendet wird die erste.`);
      return;
    }
    indexOf.set(column.key, index);
  });

  const missingRequired = columns.filter((c) => c.required && !indexOf.has(c.key));
  if (missingRequired.length > 0) {
    throw new DataError(
      `Im Blatt „Öffentlich“ fehlen Pflichtspalten: ${missingRequired.map((c) => `„${c.header}“`).join(', ')}. ` +
        'Bitte die Kopfzeile im Google Sheet prüfen (Schreibweise wie im Formular).',
      messages,
    );
  }
  for (const c of columns) {
    if (c.visibility !== 'private' && !c.required && !indexOf.has(c.key)) {
      warn(`Spalte „${c.header}“ fehlt im Blatt „Öffentlich“ – das Feld bleibt leer.`);
    }
  }

  const stats = { rows: rows.length, published: 0, notApproved: 0, noConsent: 0, invalid: 0 };
  const taken = new Set<string>();
  const entries: PipelineEntry[] = [];

  rows.forEach((row, i) => {
    const line = i + 2; // row number as shown in Google Sheets
    const read = (key: ColumnKey): string => {
      if (!READABLE_KEYS.has(key)) throw new Error(`Interner Fehler: privates Feld ${key} angefragt.`);
      const index = indexOf.get(key);
      return index === undefined ? '' : (row[index] ?? '').trim();
    };
    const text = (key: ColumnKey): string | null => cleanText(read(key));

    if (!isChecked(read('approved'))) {
      stats.notApproved++;
      return;
    }
    if (!isConsent(read('consentPublish'))) {
      stats.noConsent++;
      warn(`Zeile ${line}: „Freigegeben“ ist angehakt, aber die Einrichtung hat der Veröffentlichung nicht zugestimmt – Eintrag wird nicht veröffentlicht.`);
      return;
    }

    const name = text('name');
    if (!name) {
      stats.invalid++;
      warn(`Zeile ${line}: Name der Einrichtung fehlt – Eintrag übersprungen.`);
      return;
    }
    const label = `Zeile ${line} („${name}“)`;

    const area = resolveArea(read('area'), (msg) => warn(`${label}: ${msg}`));
    const amount = resolveAmount(read('amountVerified'), read('amountReported'), (msg) => warn(`${label}: ${msg}`));
    const links = extractUrls(read('links'));
    const infoLinks = extractUrls(read('infoLink'));
    if (read('infoLink') && infoLinks.length === 0) warn(`${label}: Link zu weiterführenden Informationen ist keine gültige Web-Adresse.`);

    let imageRef: ImageRef | null = null;
    const imageRaw = read('imageUrls');
    if (imageRaw) {
      if (!isConsent(read('consentImages'))) {
        warn(`${label}: Bild vorhanden, aber Bildrechte nicht bestätigt – es wird ein Platzhalter angezeigt.`);
      } else {
        imageRef = parseImageRef(imageRaw, options);
        if (!imageRef) warn(`${label}: Bild-Link nicht erkannt („${imageRaw.slice(0, 80)}“) – es wird ein Platzhalter angezeigt.`);
      }
    }

    const institution: Institution = {
      slug: uniqueSlug(name, taken),
      name,
      area,
      address: text('address'),
      description: text('description'),
      reach: text('reach'),
      project: text('project'),
      cutDescription: text('cutDescription'),
      amount: amount?.value ?? null,
      amountKind: amount?.kind ?? null,
      amountSource: amount ? text('amountSource') : null,
      consequences: text('consequences'),
      quote: stripQuotes(text('quote')),
      website: links[0] ?? null,
      links,
      infoLink: infoLinks[0] ?? null,
      image: null,
      featured: isChecked(read('featured')),
    };

    stats.published++;
    entries.push({ institution, imageRef, imageCredit: text('imageCredit') });
  });

  return { entries, messages, stats };
}

function resolveArea(raw: string, warn: (msg: string) => void): Institution['area'] {
  const value = raw.trim().toLowerCase();
  const match = areas.find((a) => a.matches.includes(value) || a.label.toLowerCase() === value);
  if (match) return match.slug;
  warn(value ? `Unbekannter Bereich „${raw.trim()}“ – wird unter „Sonstiges“ einsortiert.` : 'Kein Bereich angegeben – wird unter „Sonstiges“ einsortiert.');
  return FALLBACK_AREA;
}

function resolveAmount(
  verifiedRaw: string,
  reportedRaw: string,
  warn: (msg: string) => void,
): { value: number; kind: 'verified' | 'reported' } | null {
  const verified = parseAmount(verifiedRaw);
  if (verified.ok) return { value: verified.value, kind: 'verified' };
  if (verified.reason === 'unreadable') warn(`„Betrag_geprüft“ nicht lesbar („${verifiedRaw}“) – es wird die Angabe der Einrichtung verwendet.`);

  const reported = parseAmount(reportedRaw);
  if (reported.ok) return { value: reported.value, kind: 'reported' };
  if (reported.reason === 'unreadable') warn(`Betrag nicht lesbar („${reportedRaw}“) – Kachel zeigt „Betrag folgt“.`);
  return null;
}

/** Trims every line, collapses runs of spaces, keeps paragraph breaks. Empty → null. */
export function cleanText(raw: string): string | null {
  const text = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text === '' ? null : text;
}

/** Removes pairs of quotation marks around a quote; the design adds its own „ “. */
export function stripQuotes(text: string | null): string | null {
  if (!text) return text;
  const QUOTE = /["„“”»«‚‘’']/;
  let stripped = text.trim();
  while (stripped.length >= 2 && QUOTE.test(stripped[0]!) && QUOTE.test(stripped[stripped.length - 1]!)) {
    stripped = stripped.slice(1, -1).trim();
  }
  return stripped === '' ? null : stripped;
}

/** Finds http(s) addresses in free text; "www.example.de" gets https:// added. */
export function extractUrls(raw: string): string[] {
  const found = raw.match(/(https?:\/\/[^\s,;<>"]+|www\.[^\s,;<>"]+)/gi) ?? [];
  const urls: string[] = [];
  for (const candidate of found) {
    const withProtocol = candidate.startsWith('www.') ? `https://${candidate}` : candidate;
    try {
      const url = new URL(withProtocol.replace(/[).]+$/, ''));
      if ((url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.')) {
        const href = url.toString();
        if (!urls.includes(href)) urls.push(href);
      }
    } catch {
      // not a URL – ignore
    }
  }
  return urls;
}

/** Google Drive links from Forms uploads, or sample paths in local development. */
export function parseImageRef(raw: string, options: PipelineOptions): ImageRef | null {
  const first = raw.split(/[,\s]+/).find((part) => part.trim() !== '') ?? '';

  const driveId =
    /drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([\w-]{10,})/.exec(first)?.[1] ??
    /drive\.google\.com\/file\/d\/([\w-]{10,})/.exec(first)?.[1];
  if (driveId) return { kind: 'drive', id: driveId };

  if (options.allowSampleImages && /^[\w-]+(\/[\w-]+)*\.(jpe?g|png|webp)$/i.test(first)) {
    return { kind: 'sample', path: first };
  }
  return null;
}
