// Single source of truth for every colour on the site.
// CSS custom properties are generated from this file (see src/pages/tokens.css.ts),
// so Social-Media tiles, Open-Graph images and the website always match.

export const base = {
  ink: '#111111',
  paper: '#F4F1EA',
  /** Pure white, only for tiny details on dark surfaces. */
  white: '#FFFFFF',
  /** Thin rules and muted text on paper. Must keep AA contrast against paper. */
  muted: '#55524C',
} as const;

/**
 * Signal colour for donation buttons and the donation block.
 * Must not be used for any area.
 */
export const signal = '#C8FF00';

/**
 * One strong colour per area, keyed by the area slug (see src/data/areas.ts).
 * Text colour (ink or paper) is chosen automatically by contrast.
 */
export const areaColors = {
  kultur: '#D0021B',
  bildung: '#1F3DFF',
  soziales: '#FF6B00',
  jugend: '#FF2E93',
  sport: '#00B5E2',
  umwelt: '#00A651',
  sonstiges: '#FFD400',
} as const satisfies Record<string, string>;

export type AreaColorKey = keyof typeof areaColors;

/** Text colours that may be placed on coloured surfaces. */
export const textCandidates = [base.ink, base.paper] as const;
