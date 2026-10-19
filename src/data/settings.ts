// Content the team edits in the "Einstellungen" sheet (columns "Schlüssel" and "Wert").
// Every key has a default, so an empty or missing sheet never breaks the site.

import { readKeyValueRows, type KeyValueRow } from './settings-table.ts';
import type { BuildMessage } from './types.ts';
import { parseAmount } from '../lib/amount.ts';
import { extractUrls } from './pipeline.ts';

export interface Settings {
  wirwunderUrl: string | null;
  donationCurrent: number | null;
  donationGoal: number | null;
  donationDate: string | null;
  formUrl: string | null;
  sourceUrl: string | null;
  sourceTitle: string;
  contactEmail: string | null;
  instagramUrl: string | null;
  heroSubtitle: string;
  notice: string | null;
  hashtags: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  wirwunderUrl: null,
  donationCurrent: null,
  donationGoal: 500_000,
  donationDate: null,
  formUrl: null,
  sourceUrl: null,
  sourceTitle:
    'Mitteilung der Verwaltung an den Stadtrat vom 24.09.2026, Vorlage II/056/2026 „Haushaltskonsolidierung: Einbringung von Einsparmöglichkeiten zum Haushaltsentwurf 2027“',
  contactEmail: null,
  instagramUrl: null,
  heroSubtitle: 'weniger im Jahr 2027 für Kultur, Bildung und Soziales in Erlangen',
  notice: null,
  hashtags: ['#ÄrmerOhneUns', '#Erlangen', '#Kulturerhalten'],
};

type Kind = 'url' | 'amount' | 'text' | 'email' | 'hashtags';

const KEYS: Record<string, { field: keyof Settings; kind: Kind }> = {
  wirwunder_url: { field: 'wirwunderUrl', kind: 'url' },
  spenden_stand_euro: { field: 'donationCurrent', kind: 'amount' },
  spenden_ziel_euro: { field: 'donationGoal', kind: 'amount' },
  spenden_stand_datum: { field: 'donationDate', kind: 'text' },
  formular_url: { field: 'formUrl', kind: 'url' },
  quelle_vorlage_url: { field: 'sourceUrl', kind: 'url' },
  quelle_vorlage_titel: { field: 'sourceTitle', kind: 'text' },
  kontakt_email: { field: 'contactEmail', kind: 'email' },
  instagram_url: { field: 'instagramUrl', kind: 'url' },
  hero_untertitel: { field: 'heroSubtitle', kind: 'text' },
  aktueller_hinweis: { field: 'notice', kind: 'text' },
  hashtags: { field: 'hashtags', kind: 'hashtags' },
};

export const SETTINGS_KEYS = Object.keys(KEYS);

export function parseSettings(table: string[][]): { settings: Settings; messages: BuildMessage[] } {
  const messages: BuildMessage[] = [];
  const warn = (message: string) => messages.push({ severity: 'warning', message });
  const settings: Settings = { ...DEFAULT_SETTINGS, hashtags: [...DEFAULT_SETTINGS.hashtags] };

  const rows: KeyValueRow[] = readKeyValueRows(table, warn);
  for (const { key, value, line } of rows) {
    const def = KEYS[key];
    if (!def) {
      warn(`Einstellungen, Zeile ${line}: unbekannter Schlüssel „${key}“ wird ignoriert.`);
      continue;
    }
    if (value === '') continue; // keep default

    const target = settings as unknown as Record<string, unknown>;
    switch (def.kind) {
      case 'url': {
        const [url] = extractUrls(value);
        if (url) target[def.field] = url;
        else warn(`Einstellungen „${key}“: „${value}“ ist keine gültige Web-Adresse – Standardwert bleibt.`);
        break;
      }
      case 'amount': {
        const amount = parseAmount(value);
        if (amount.ok) target[def.field] = amount.value;
        else warn(`Einstellungen „${key}“: „${value}“ ist kein lesbarer Betrag – Standardwert bleibt.`);
        break;
      }
      case 'email':
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) target[def.field] = value;
        else warn(`Einstellungen „${key}“: „${value}“ ist keine gültige E-Mail-Adresse.`);
        break;
      case 'hashtags': {
        const tags = value
          .split(/[\s,]+/)
          .filter(Boolean)
          .map((t) => (t.startsWith('#') ? t : `#${t}`));
        if (tags.length > 0) target[def.field] = tags;
        break;
      }
      default:
        target[def.field] = value;
    }
  }
  return { settings, messages };
}
