// Turns the rows of the published "Öffentlich" sheet into organisations and their projects.
// One row = one project = one tile. Rows of the path "weiteres Projekt" attach to an organisation
// that was entered (and approved) through the path "neue Einrichtung".
//
// Privacy safety net: values are read ONLY through `read()`, which refuses every key that is
// not on the allowlist (src/data/columns.ts). Even if the sheet accidentally publishes private
// columns, they are never copied into the output.

import { areas, FALLBACK_AREA } from './areas.ts';
import { columns, findColumn, isChecked, isConsent, READABLE_KEYS, type ColumnKey } from './columns.ts';
import type { BuildMessage, ImageRef, OrganisationEntry, Project, ProjectEntry } from './types.ts';
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
  organisations: OrganisationEntry[];
  projects: ProjectEntry[];
  messages: BuildMessage[];
  stats: {
    rows: number;
    projects: number;
    organisations: number;
    notApproved: number;
    noConsent: number;
    invalid: number;
  };
}

/** Long project names usually mean the old combined question was answered with the consequences. */
const PROJECT_NAME_MAX = 90;

export function runPipeline(table: string[][], options: PipelineOptions): PipelineResult {
  const messages: BuildMessage[] = [];
  const warn = (message: string) => messages.push({ severity: 'warning', message });

  const [header, ...rows] = table;
  if (!header || header.every((h) => h.trim() === '')) {
    throw new DataError(
      'Das Blatt „Öffentlich“ ist leer – es wurde keine Kopfzeile gefunden. Meist liefert die Formel in A1 einen Fehler ' +
        '(z. B. eine umbenannte Überschrift). Siehe docs/google-sheet/oeffentlich-formel.md.',
    );
  }

  // Google Sheets formula errors (#REF!, #NAME?, #N/A, #VALUE!, #ERROR!) end up in the header row.
  const formulaError = header.find((h) => /^#(REF!|NAME\?|N\/A|VALUE!|ERROR!|DIV\/0!)/i.test(h.trim()));
  if (formulaError) {
    throw new DataError(
      `Die Formel im Blatt „Öffentlich“ liefert den Fehler „${formulaError.trim()}“. ` +
        'Meist stimmt der Name des Quellblatts in der Formel nicht (aktuell: „Formularantworten“) oder eine Überschrift ' +
        'wurde im Formular umbenannt. Siehe docs/google-sheet/oeffentlich-formel.md.',
    );
  }

  // Map key -> column indexes, allowlisted keys only. A key can have several columns (e.g. an old and a
  // renamed question both still in the sheet); per row the first non-empty value counts.
  const indexOf = new Map<ColumnKey, number[]>();
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
    indexOf.set(column.key, [...(indexOf.get(column.key) ?? []), index]);
  });

  const missingRequired = columns.filter((c) => c.required && !indexOf.has(c.key));
  if (missingRequired.length > 0) {
    throw new DataError(
      `Im Blatt „Öffentlich“ fehlen Pflichtspalten: ${missingRequired.map((c) => `„${c.header}“`).join(', ')}. ` +
        'Bitte die Kopfzeile im Google Sheet prüfen (Schreibweise wie im Formular).',
      messages,
    );
  }
  const missingOptional = columns.filter((c) => c.visibility !== 'private' && !c.required && !c.legacy && !indexOf.has(c.key));
  if (missingOptional.length > 0) {
    warn(`Diese Spalten fehlen im Blatt „Öffentlich“ und bleiben leer: ${missingOptional.map((c) => `„${c.header}“`).join(', ')}.`);
  }

  const stats = { rows: rows.length, projects: 0, organisations: 0, notApproved: 0, noConsent: 0, invalid: 0 };
  const orgSlugs = new Set<string>();
  const orgByKey = new Map<string, OrganisationEntry>();
  const anchorsByOrg = new Map<string, Set<string>>();
  const projects: ProjectEntry[] = [];
  const pendingAdditional: Array<() => void> = [];

  rows.forEach((row, i) => {
    const line = i + 2; // row number as shown in Google Sheets
    const read = (key: ColumnKey): string => {
      if (!READABLE_KEYS.has(key)) throw new Error(`Interner Fehler: privates Feld ${key} angefragt.`);
      for (const index of indexOf.get(key) ?? []) {
        const value = (row[index] ?? '').trim();
        if (value !== '') return value;
      }
      return '';
    };
    const text = (key: ColumnKey): string | null => cleanText(read(key));

    // A copy of the header row (e.g. from a faulty sheet formula) is never an entry.
    const nameIndex = indexOf.get('name')![0]!;
    if ((row[nameIndex] ?? '').trim() === (header[nameIndex] ?? '').trim()) {
      warn(`Zeile ${line} wiederholt die Kopfzeile und wird ignoriert – bitte die Formel im Blatt „Öffentlich“ prüfen.`);
      return;
    }

    if (!isChecked(read('approved'))) {
      stats.notApproved++;
      return;
    }
    if (!isConsent(read('consentPublish'))) {
      stats.noConsent++;
      warn(`Zeile ${line}: „Freigeben“ ist angehakt, aber es fehlt die Zustimmung zur Veröffentlichung – Eintrag wird nicht veröffentlicht.`);
      return;
    }

    const additional = isAdditionalProject(read('entryType'));
    const orgName = additional ? text('orgSelect') : text('name');
    if (!orgName) {
      stats.invalid++;
      warn(
        additional
          ? `Zeile ${line}: Weiteres Projekt ohne ausgewählte Einrichtung – übersprungen.`
          : `Zeile ${line}: Name der Einrichtung fehlt – Eintrag übersprungen.`,
      );
      return;
    }
    const label = `Zeile ${line} („${orgName}“)`;
    const imagesAllowed = isConsent(read('consentImages'));

    const imageRefFor = (key: 'imageUrls' | 'projectImageUrls'): ImageRef | null => {
      const raw = read(key);
      if (!raw) return null;
      if (!imagesAllowed) {
        warn(`${label}: Bild vorhanden, aber Bildrechte nicht bestätigt – es wird nicht verwendet.`);
        return null;
      }
      const ref = parseImageRef(raw, options);
      if (!ref) warn(`${label}: Bild-Link nicht erkannt („${raw.slice(0, 80)}“) – es wird nicht verwendet.`);
      return ref;
    };

    // Organisation data only comes from "new organisation" rows.
    if (!additional) {
      const key = orgKey(orgName);
      if (orgByKey.has(key)) {
        warn(`${label}: Die Einrichtung ist mehrfach als neu eingetragen. Das Projekt wird ihr zugeordnet, die Basisdaten kommen aus dem ersten Eintrag.`);
      } else {
        const links = extractUrls(read('links'));
        orgByKey.set(key, {
          organisation: {
            slug: uniqueSlug(orgName, orgSlugs),
            name: orgName,
            address: text('address'),
            description: text('description'),
            reach: text('reach'),
            website: links[0] ?? null,
            links,
            logo: null,
          },
          logoRef: imageRefFor('imageUrls'),
          logoCredit: text('imageCredit') ?? text('imageCreditLegacy'),
        });
      }
    }

    const area = resolveArea(read('area'), (msg) => warn(`${label}: ${msg}`));
    const amount = resolveAmount(read('amountVerified'), read('amountReported'), (msg) => warn(`${label}: ${msg}`));
    const infoLinks = extractUrls(read('infoLink'));
    if (read('infoLink') && infoLinks.length === 0) warn(`${label}: Link zu weiterführenden Informationen ist keine gültige Web-Adresse.`);
    const projectName = text('project');
    if (projectName && projectName.length > PROJECT_NAME_MAX) {
      warn(`${label}: Projektname ist sehr lang (${projectName.length} Zeichen) – bitte im Sheet kürzen; er steht groß auf der Kachel.`);
    }
    const imageRef = imageRefFor('projectImageUrls');
    const imageCredit = text('projectImageCredit');
    const featured = isChecked(read('featured'));
    const fields = {
      area,
      cutDescription: text('cutDescription'),
      amount: amount?.value ?? null,
      amountKind: amount?.kind ?? null,
      amountSource: amount ? text('amountSource') : null,
      amountLater: text('amountLater'),
      amountPercent: text('amountPercent'),
      nonMonetary: text('nonMonetary'),
      consequences: text('consequences'),
      quote: stripQuotes(text('quote')),
      infoLink: infoLinks[0] ?? null,
    };

    // Additional projects are attached after all organisations are known (row order does not matter).
    const attach = () => {
      const org = orgByKey.get(orgKey(orgName));
      if (!org) {
        stats.invalid++;
        warn(`${label}: Weiteres Projekt für eine Einrichtung, die nicht (mehr) freigegeben ist – übersprungen.`);
        return;
      }
      const o = org.organisation;
      const anchors = anchorsByOrg.get(o.slug) ?? new Set<string>();
      anchorsByOrg.set(o.slug, anchors);
      const name = projectName ?? o.name;
      const anchor = uniqueSlug(projectName ?? 'projekt', anchors);
      projects.push({
        project: {
          id: `${o.slug}--${anchor}`,
          anchor,
          orgSlug: o.slug,
          orgName: o.name,
          name,
          ...fields,
          image: null,
          ownImage: false,
          featured,
        },
        imageRef,
        imageCredit,
      });
      stats.projects++;
    };
    if (additional) pendingAdditional.push(attach);
    else attach();
  });

  pendingAdditional.forEach((attach) => attach());

  const organisations = [...orgByKey.values()].filter((o) => projects.some((p) => p.project.orgSlug === o.organisation.slug));
  stats.organisations = organisations.length;
  return { organisations, projects, messages, stats };
}

/** "Ein weiteres betroffenes Projekt für eine bereits eingetragene Einrichtung" → true. Empty (old answers) → false. */
export function isAdditionalProject(value: string): boolean {
  return /weiteres/i.test(value);
}

function orgKey(name: string): string {
  return name.replace(/\s+/g, ' ').trim().toLocaleLowerCase('de');
}

function resolveArea(raw: string, warn: (msg: string) => void): Project['area'] {
  const value = raw.replace(/\s+/g, ' ').trim().toLowerCase();
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
