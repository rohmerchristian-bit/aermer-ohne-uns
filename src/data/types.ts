import type { AreaColorKey } from '../design/colors.ts';

// Public shape of one institution as used by pages and components.
// Built field by field in src/data/pipeline.ts – only allowlisted public fields can end up here.

export type AmountKind = 'verified' | 'reported';

export interface ImageSource {
  srcset: string;
  type: 'image/avif' | 'image/webp';
}

export interface InstitutionImage {
  /** 'logo' images are shown whole on a plain background, 'photo' images fill the frame. */
  kind: 'logo' | 'photo';
  /** Fallback file (WebP, medium width). */
  src: string;
  sources: ImageSource[];
  width: number;
  height: number;
  alt: string;
  credit: string | null;
}

export interface Institution {
  slug: string;
  name: string;
  area: AreaColorKey;
  address: string | null;
  description: string | null;
  reach: string | null;
  project: string | null;
  cutDescription: string | null;
  amount: number | null;
  amountKind: AmountKind | null;
  amountSource: string | null;
  consequences: string | null;
  quote: string | null;
  website: string | null;
  /** All web links the institution gave (website, social media). */
  links: string[];
  infoLink: string | null;
  image: InstitutionImage | null;
  featured: boolean;
}

/** Where to fetch the image from – used only during the build, never published. */
export type ImageRef = { kind: 'drive'; id: string } | { kind: 'sample'; path: string };

export interface PipelineEntry {
  institution: Institution;
  imageRef: ImageRef | null;
  imageCredit: string | null;
}

export type Severity = 'error' | 'warning';

export interface BuildMessage {
  severity: Severity;
  message: string;
}
