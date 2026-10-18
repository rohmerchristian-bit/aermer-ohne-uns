// Read access for pages and components. The JSON files are written by `npm run data`
// (scripts/prepare-data.ts) before every dev or build run.

import data from '../generated/institutions.json';
import settingsData from '../generated/settings.json';
import type { Institution } from './types.ts';
import type { Settings } from './settings.ts';

export const institutions = data.institutions as Institution[];
export const settings = settingsData as Settings;

/** Sum of all cuts on the platform, per year (no estimates). */
export const totalAmount: number = data.total;
export const institutionCount: number = institutions.length;
export const generatedAt: string = data.generatedAt;

/** Featured entries first, then by amount (largest first), then by name. */
export function sortedForGrid(list: Institution[] = institutions): Institution[] {
  return [...list].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      (b.amount ?? -1) - (a.amount ?? -1) ||
      a.name.localeCompare(b.name, 'de'),
  );
}

export function getInstitution(slug: string): Institution | undefined {
  return institutions.find((i) => i.slug === slug);
}
