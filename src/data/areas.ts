import { areaColors, textCandidates, type AreaColorKey } from '../design/colors.ts';
import { pickTextColor } from '../lib/contrast.ts';

// The seven areas exactly as offered in the Google Form ("Zu welchem Bereich gehört …?").
// To rename an area: change `label` and add the new form wording to `matches`; keep `slug` stable,
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
  { slug: 'kultur', label: 'Kultur & Kunst', matches: ['kultur & kunst', 'kultur'] },
  { slug: 'bildung', label: 'Bildung & Schule / Weiterbildung', matches: ['bildung & schule / weiterbildung', 'bildung'] },
  { slug: 'soziales', label: 'Soziales, Familie & Senioren', matches: ['soziales, familie & senioren', 'soziales'] },
  { slug: 'jugend', label: 'Kinder & Jugend', matches: ['kinder & jugend', 'jugend'] },
  { slug: 'sport', label: 'Sport & Freizeit', matches: ['sport & freizeit', 'sport'] },
  { slug: 'umwelt', label: 'Umwelt & Nachhaltigkeit', matches: ['umwelt & nachhaltigkeit', 'umwelt'] },
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
