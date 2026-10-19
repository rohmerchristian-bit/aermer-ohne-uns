// Central mapping from Google Form question titles (= CSV headers) to internal keys.
// If a question title changes in the form, adjust `header` here – nowhere else.
//
// Headers are compared after normalisation (trimmed, repeated whitespace collapsed,
// case-insensitive), so leading spaces in the form titles do not matter.

export type ColumnKey =
  | 'submittedAt'
  | 'entryType'
  | 'orgSelect'
  | 'projectContact'
  | 'amountLater'
  | 'amountPercent'
  | 'nonMonetary'
  | 'projectImageUrls'
  | 'projectImageCredit'
  | 'imageCreditLegacy'
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
  | 'help'
  | 'demo'
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
  /** Column of a question that no longer exists in the form: no warning when it is missing. */
  legacy?: boolean;
}

export const columns: readonly ColumnDef[] = [
  { key: 'submittedAt', header: 'Zeitstempel', visibility: 'private' },
  // Section 1 (start): which path. Empty for answers given before the form was split.
  { key: 'entryType', header: 'Was möchtet ihr eintragen?', visibility: 'filter' },
  // Section 7 (additional project): organisation chosen from the list.
  { key: 'orgSelect', header: 'Für welche Einrichtung tragt ihr ein weiteres Projekt ein?', visibility: 'public' },
  {
    key: 'projectContact',
    header: 'Ansprechperson für dieses Projekt',
    visibility: 'private',
    headerStartsWith: ['Ansprechperson für dieses Projekt'],
  },
  { key: 'name', header: 'Name der Institution / Einrichtung', visibility: 'public', required: true },
  {
    key: 'area',
    header: 'Zu welchem Bereich gehört eure Einrichtung?',
    visibility: 'public',
    required: true,
    aliases: ['Zu welchem Bereich gehört das Projekt / Angebot?'],
  },
  { key: 'address', header: 'Standort / Adresse', visibility: 'public' },
  {
    key: 'contact',
    header: 'Ansprechperson für das Bündnis (Format: Vorname, Nachname, Funktion)',
    visibility: 'private',
  },
  {
    key: 'email',
    header: 'E-Mail-Adresse für Rückfragen & Bündnisarbeit',
    visibility: 'private',
    aliases: ['E-Mail-Adresse'],
  },
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
  {
    key: 'amountReported',
    header: 'Geplante Kürzung in Euro pro Jahr',
    visibility: 'public',
    aliases: ['Geplante Kürzung 2027 in Euro'],
  },
  { key: 'amountLater', header: 'Kürzung in den Folgejahren', visibility: 'public' },
  { key: 'amountPercent', header: 'Kürzung in Prozent', visibility: 'public' },
  {
    key: 'nonMonetary',
    header: 'Falls es nicht um einen Geldbetrag geht: Was fällt weg?',
    visibility: 'public',
  },
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
  {
    key: 'imageUrls',
    header: 'Bild-/Logo-Upload für euer Profil auf der Plattform',
    visibility: 'public',
    aliases: ['Logo-Upload für euer Profil auf der Plattform', 'Logo der Einrichtung'],
    // NOTE: this is the organisation's logo (section 4); project images are projectImageUrls.
  },
  { key: 'imageCredit', header: 'Bildnachweis zum Logo', visibility: 'public' },
  // The original credit question was removed from the form; its column still holds older answers.
  { key: 'imageCreditLegacy', header: 'Bildnachweis (Fotograf*in / Rechteinhaber)', visibility: 'public', legacy: true },
  { key: 'projectImageUrls', header: 'Bild oder Logo für dieses Projekt', visibility: 'public' },
  { key: 'projectImageCredit', header: 'Bildnachweis zum Projektbild', visibility: 'public' },
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
  {
    // Demo registration (section "Demo // 18.11.2026"): internal only.
    key: 'demo',
    header: 'Ich möchte dabei sein und als Teil des Bündnis "ÄrmerOhneUns" an dem Demo mit meiner Organisation teilnehmen (kostenlos).',
    visibility: 'private',
    headerStartsWith: ['Ich möchte dabei sein und als Teil des Bündnis'],
  },
  {
    // Private until the initiative decides whether help offers are shown on the website.
    key: 'help',
    header: 'Wie könnte man Euch helfen, wenn es zur Einsparung kommt?',
    visibility: 'private',
  },
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
