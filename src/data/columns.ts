// Central mapping from Google Form question titles (= CSV headers) to internal keys.
// If a question title changes in the form, adjust `header` here – nowhere else.
//
// Headers are compared after normalisation (trimmed, repeated whitespace collapsed,
// case-insensitive), so leading spaces in the form titles do not matter.

export type ColumnKey =
  | 'submittedAt'
  | 'name'
  | 'area'
  | 'address'
  | 'contact'
  | 'email'
  | 'links'
  | 'description'
  | 'reach'
  | 'project'
  | 'cutDescription'
  | 'amountReported'
  | 'amountSource'
  | 'consequences'
  | 'quote'
  | 'infoLink'
  | 'imageUrls'
  | 'imageCredit'
  | 'actions'
  | 'rooms'
  | 'consentPublish'
  | 'consentImages'
  | 'mailingList'
  | 'approved'
  | 'amountVerified'
  | 'featured';

/**
 * public:   may appear on the website.
 * filter:   read only to decide whether an entry (or its image) is shown; never output.
 * private:  must never be read into the website. Expected to be missing from the "Öffentlich" sheet.
 */
export type Visibility = 'public' | 'filter' | 'private';

export interface ColumnDef {
  key: ColumnKey;
  header: string;
  visibility: Visibility;
  /** Build stops with an error if this column is missing. */
  required?: boolean;
  /** Other exact titles used in the live form (old or alternative wording). */
  aliases?: string[];
  /**
   * Also match headers that start with one of these texts. Needed where the form uses a long
   * consent text as the question title.
   */
  headerStartsWith?: string[];
}

export const columns: readonly ColumnDef[] = [
  { key: 'submittedAt', header: 'Zeitstempel', visibility: 'private' },
  { key: 'name', header: 'Name der Institution / Einrichtung', visibility: 'public', required: true },
  { key: 'area', header: 'Zu welchem Bereich gehört eure Einrichtung?', visibility: 'public', required: true },
  { key: 'address', header: 'Standort / Adresse', visibility: 'public' },
  {
    key: 'contact',
    header: 'Ansprechperson für das Bündnis (Format: Vorname, Nachname, Funktion)',
    visibility: 'private',
  },
  { key: 'email', header: 'E-Mail-Adresse für Rückfragen & Bündnisarbeit', visibility: 'private' },
  { key: 'links', header: 'Website / Social-Media-Kanäle', visibility: 'public' },
  {
    key: 'description',
    header: 'Was tut eure Institution in Kürze? (Kurzbeschreibung der Arbeit)',
    visibility: 'public',
  },
  { key: 'reach', header: 'Wen erreicht eure Arbeit? (Zielgruppen & Reichweite in Zahlen)', visibility: 'public' },
  {
    key: 'project',
    header: 'Betroffenes Projekt / Angebot',
    visibility: 'public',
    aliases: ['Betroffenes Projekt / Angebot: Welche konkreten Folgen hat die Kürzung?'],
  },
  {
    key: 'cutDescription',
    header: 'Welche Zuschüsse / Mittel sollen gestrichen oder gekürzt werden?',
    visibility: 'public',
  },
  { key: 'amountReported', header: 'Geplante Kürzung in Euro pro Jahr', visibility: 'public' },
  { key: 'amountSource', header: 'Quelle des Betrags', visibility: 'public' },
  {
    key: 'consequences',
    header: 'Welche konkreten Folgen hat die Kürzung?',
    visibility: 'public',
    aliases: ['Absagen von Angeboten, Stellenabbau, Schließzeiten, etc.'],
  },
  { key: 'quote', header: 'Prägnantes Zitat / Statement zur Lage (Short Quote)', visibility: 'public' },
  {
    key: 'infoLink',
    header: 'Link zu weiterführenden Informationen / Stellungnahmen / Petitionen',
    visibility: 'public',
  },
  { key: 'imageUrls', header: 'Bild-/Logo-Upload für euer Profil auf der Plattform', visibility: 'public' },
  { key: 'imageCredit', header: 'Bildnachweis (Fotograf*in / Rechteinhaber)', visibility: 'public' },
  {
    key: 'actions',
    header: 'Plant ihr eigene Aktionen, Proteste oder Veranstaltungen zur Kürzungswelle? Wenn ja, welche?',
    visibility: 'private',
  },
  {
    key: 'rooms',
    header: 'Wärt ihr bereit, Räume oder Infrastruktur für Treffen des Bündnisses bereitzustellen?',
    visibility: 'private',
  },
  { key: 'consentPublish', header: 'Freigabe zur Veröffentlichung', visibility: 'filter', required: true },
  {
    key: 'consentImages',
    header: 'Rechte an Bildern und Logos',
    visibility: 'filter',
    headerStartsWith: ['Mit dem Hochladen bestätigen wir, dass wir die erforderlichen Nutzungsrechte'],
  },
  { key: 'mailingList', header: 'Aufnahme in den Bündnis-Verteiler', visibility: 'private' },
  { key: 'approved', header: 'Freigegeben', visibility: 'filter', required: true, aliases: ['Freigeben'] },
  { key: 'amountVerified', header: 'Betrag_geprüft', visibility: 'public' },
  { key: 'featured', header: 'Hervorheben', visibility: 'public' },
];

/** Keys that may be read from the CSV at all. Everything else is dropped on import. */
export const READABLE_KEYS: ReadonlySet<ColumnKey> = new Set(
  columns.filter((c) => c.visibility !== 'private').map((c) => c.key),
);

export const PRIVATE_KEYS: ReadonlySet<ColumnKey> = new Set(
  columns.filter((c) => c.visibility === 'private').map((c) => c.key),
);

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .replace(/[\s\u00A0]+/g, ' ')
    .trim()
    .toLowerCase();
}

const byHeader = new Map(columns.flatMap((c) => [c.header, ...(c.aliases ?? [])].map((h) => [normalizeHeader(h), c] as const)));

const byPrefix = columns.flatMap((c) => (c.headerStartsWith ?? []).map((p) => [normalizeHeader(p), c] as const));

export function findColumn(header: string): ColumnDef | undefined {
  const normalized = normalizeHeader(header);
  return byHeader.get(normalized) ?? byPrefix.find(([prefix]) => normalized.startsWith(prefix))?.[1];
}

/**
 * Consent questions are single checkboxes in the form: the cell holds the checkbox text
 * when ticked and is empty otherwise. Any non-empty answer that does not start with
 * "nein" counts as consent.
 */
export function isConsent(value: string | undefined): boolean {
  const v = (value ?? '').trim().toLowerCase();
  return v !== '' && !v.startsWith('nein');
}

/** Google Sheets checkboxes export as TRUE/FALSE (or WAHR/FALSCH in German locale). */
export function isChecked(value: string | undefined): boolean {
  return ['true', 'wahr', 'ja', 'x', '1'].includes((value ?? '').trim().toLowerCase());
}
