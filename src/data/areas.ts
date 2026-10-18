import { areaColors, textCandidates, type AreaColorKey } from '../design/colors';
import { pickTextColor } from '../lib/contrast';

// Placeholder names until the team delivers the final seven areas.
// To rename an area, change `label` (and `matches` for the CSV values); keep `slug` stable
// because it appears in URLs (?bereich=kultur) and in the colour tokens.

export interface Area {
  slug: AreaColorKey;
  /** Display name on the website. */
  label: string;
  /** Lower-case values from the form that map to this area. */
  matches: string[];
  color: string;
  textColor: string;
}

const definitions: Array<Omit<Area, 'color' | 'textColor'>> = [
  { slug: 'kultur', label: 'Kultur', matches: ['kultur'] },
  { slug: 'bildung', label: 'Bildung', matches: ['bildung'] },
  { slug: 'soziales', label: 'Soziales', matches: ['soziales'] },
  { slug: 'jugend', label: 'Jugend', matches: ['jugend'] },
  { slug: 'sport', label: 'Sport', matches: ['sport'] },
  { slug: 'umwelt', label: 'Umwelt', matches: ['umwelt'] },
  { slug: 'sonstiges', label: 'Sonstiges', matches: ['sonstiges'] },
];

export const FALLBACK_AREA: AreaColorKey = 'sonstiges';

export const areas: Area[] = definitions.map((area) => {
  const color = areaColors[area.slug];
  return { ...area, color, textColor: pickTextColor(color, textCandidates).color };
});

export function getArea(slug: string): Area {
  return areas.find((a) => a.slug === slug) ?? areas.find((a) => a.slug === FALLBACK_AREA)!;
}
