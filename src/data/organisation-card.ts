import { areas, getArea } from './areas.ts';
import { count, getOrganisation, projectsOf } from './index.ts';
import { formatCut } from '../lib/format.ts';
import type { OrganisationCard } from '../lib/og.ts';

/** Content of an organisation's share image (also used for its alt text). */
export function organisationCard(slug: string): OrganisationCard {
  const org = getOrganisation(slug);
  if (!org) throw new Error(`Unbekannte Einrichtung: ${slug}`);
  const own = projectsOf(slug);
  const main = getArea(own[0]?.area ?? 'sonstiges');
  const total = own.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  return {
    name: org.name,
    areas: areas
      .filter((a) => own.some((p) => p.area === a.slug))
      .map((a) => a.label)
      .join(' · '),
    background: main.color,
    foreground: main.textColor,
    amount: total > 0 ? formatCut(total) : null,
    summary: [count(own.length, 'betroffenes Projekt', 'betroffene Projekte'), total > 0 ? 'im Jahr 2027' : null]
      .filter(Boolean)
      .join(' · '),
  };
}

export function organisationCardAlt(slug: string): string {
  const card = organisationCard(slug);
  const amount = card.amount ? `${card.amount}, ` : '';
  return `Ärmer ohne uns – ${card.name}: ${amount}${card.summary}`;
}
