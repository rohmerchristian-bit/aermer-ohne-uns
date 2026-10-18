import type { AreaColorKey } from '../design/colors';

// Public shape of one institution as used by pages and components.
// Only fields from the public allowlist may ever appear here (see src/data/columns.ts, Phase 2).

export type AmountKind = 'verified' | 'reported';

export interface InstitutionImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  credit: string | null;
}

export interface Institution {
  slug: string;
  name: string;
  area: AreaColorKey;
  project: string | null;
  amount: number | null;
  amountKind: AmountKind | null;
  amountSource: string | null;
  description: string | null;
  quote: string | null;
  consequences: string | null;
  website: string | null;
  infoLink: string | null;
  image: InstitutionImage | null;
  featured: boolean;
}
