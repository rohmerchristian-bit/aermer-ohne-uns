// Status of a project after the council sessions (admin column "Status" in the sheet, a dropdown).
// The alliance sets it by hand; the website shows it as a black band on the tile.

export type RescueStatus = 'provisional' | 'until2027' | 'until2029' | 'removed';

/** Dropdown values in the sheet → status. Compared case-insensitively, spaces collapsed. */
const VALUES: Record<string, RescueStatus> = {
  'vorläufig gerettet': 'provisional',
  'gerettet bis 2027': 'until2027',
  'gerettet bis 2029': 'until2029',
  'von der liste entfernt': 'removed',
};

/** Text on the band. */
export const RESCUE_LABEL: Record<RescueStatus, string> = {
  provisional: 'Vorläufig gerettet',
  until2027: 'Gerettet bis 2027',
  until2029: 'Gerettet bis 2029',
  removed: 'Von der Liste entfernt',
};

/** Longer sentence for the organisation page and screen readers. */
export const RESCUE_TEXT: Record<RescueStatus, string> = {
  provisional: 'Die Kürzung ist vorerst vom Tisch – endgültig entschieden ist noch nichts.',
  until2027: 'Die Kürzung ist für 2027 abgewendet. Für die Jahre danach ist noch nichts entschieden.',
  until2029: 'Die Kürzung ist bis einschließlich 2029 abgewendet.',
  removed: 'Die Kürzung steht nicht mehr auf der Sparliste.',
};

/** Empty → null; an unknown value → undefined (the caller warns). */
export function parseRescue(raw: string): RescueStatus | null | undefined {
  const value = raw.replace(/\s+/g, ' ').trim().toLocaleLowerCase('de');
  if (!value) return null;
  return VALUES[value];
}

/** True if the cut shown for `year` no longer applies, so the amount is struck through. */
export function rescueCovers(status: RescueStatus | null, year: number): boolean {
  switch (status) {
    case 'until2027':
      return year <= 2027;
    case 'until2029':
      return year <= 2029;
    case 'removed':
      return true;
    default:
      return false;
  }
}
