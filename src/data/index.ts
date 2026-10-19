// Read access for pages and components. The JSON files are written by `npm run data`
// (scripts/prepare-data.ts) before every dev or build run.

import data from '../generated/data.json';
import settingsData from '../generated/settings.json';
import type { Organisation, Project } from './types.ts';
import type { Settings } from './settings.ts';

export const organisations = data.organisations as Organisation[];
export const projects = data.projects as Project[];
export const settings = settingsData as Settings;

/** Sum of all cuts for 2027 on the platform (no estimates). */
export const totalAmount: number = data.total;
export const projectCount: number = projects.length;
export const organisationCount: number = organisations.length;
export const projectsWithAmount: number = data.withAmount;
export const generatedAt: string = data.generatedAt;

/** Featured projects first, then by amount (largest first), then by name. */
export function sortedForGrid(list: Project[] = projects): Project[] {
  return [...list].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      (b.amount ?? -1) - (a.amount ?? -1) ||
      a.name.localeCompare(b.name, 'de'),
  );
}

export function getOrganisation(slug: string): Organisation | undefined {
  return organisations.find((o) => o.slug === slug);
}

/** Projects of one organisation in the order they were entered. */
export function projectsOf(orgSlug: string): Project[] {
  return projects.filter((p) => p.orgSlug === orgSlug);
}

/** German count with the right noun: "1 Projekt", "3 Projekte". */
export function count(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
