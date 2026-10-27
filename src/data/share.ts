// Share images (Open Graph) per page. Paths are relative to the site root, without base.

import { budgetFacts, headline } from './budget.ts';
import { count, organisationCount, projectCount, settings, totalAmount } from './index.ts';
import { formatEuro } from '../lib/format.ts';
import type { PageCard } from '../lib/og.ts';

export type SharePage = 'standard' | 'start' | 'einrichtungen' | 'hintergrund' | 'mitmachen';

export const SHARE_PAGES: SharePage[] = ['standard', 'start', 'einrichtungen', 'hintergrund', 'mitmachen'];

export function shareImagePath(page: SharePage): string {
  return `/og/seiten/${page}.png`;
}

export function organisationShareImagePath(slug: string): string {
  return `/og/einrichtungen/${slug}.png`;
}

/** Text on the share image of each page. */
export function pageCard(page: SharePage): PageCard {
  switch (page) {
    case 'start':
      return { kicker: 'Erlangen · bis 2029', title: `${headline.millions} Mio. €`, text: settings.heroSubtitle };
    case 'einrichtungen':
      return projectCount > 0
        ? {
            kicker: 'Betroffene',
            title: `${count(projectCount, 'Projekt', 'Projekte')} von ${count(organisationCount, 'Einrichtung', 'Einrichtungen')}`,
            text: totalAmount > 0 ? `zusammen ${formatEuro(totalAmount)} weniger im Jahr 2027` : undefined,
          }
        : { kicker: 'Betroffene', title: 'Was verloren geht', text: 'Die ersten Einrichtungen tragen sich gerade ein.' };
    case 'hintergrund':
      return {
        kicker: 'Hintergrund',
        title: 'Worum es geht',
        text: `${budgetFacts[0]!.label}: ${budgetFacts[0]!.value}`,
      };
    case 'mitmachen':
      return {
        kicker: 'Mitmachen',
        title: 'Gemeinsam sind wir schwer zu übersehen.',
        text: 'Eintragen, informiert bleiben, spenden, weitersagen.',
      };
    default:
      return {
        kicker: 'Haushalt 2027 · Erlangen',
        title: 'Was verloren geht',
        text: 'Kultur, Bildung, Soziales: wer von den Kürzungen betroffen ist.',
      };
  }
}

/** Alt text for a page's share image. */
export function pageCardAlt(page: SharePage): string {
  const card = pageCard(page);
  return `Ärmer ohne uns – ${card.title}${card.text ? `: ${card.text}` : ''}`;
}
