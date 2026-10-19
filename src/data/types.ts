import type { AreaColorKey } from '../design/colors.ts';

// Public data model: an organisation ("Einrichtung") has one or more affected projects;
// every project is one tile. Built field by field in src/data/pipeline.ts – only allowlisted
// public fields can end up here.

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

export interface Organisation {
  slug: string;
  name: string;
  address: string | null;
  description: string | null;
  reach: string | null;
  website: string | null;
  /** All web links the organisation gave (website, social media). */
  links: string[];
  logo: InstitutionImage | null;
}

export interface Project {
  /** Unique across the site, used for element ids: "<org-slug>--<anchor>". */
  id: string;
  /** Anchor on the organisation page: /einrichtungen/<orgSlug>/#<anchor> */
  anchor: string;
  orgSlug: string;
  orgName: string;
  /** Project name; the organisation name if the project has none. */
  name: string;
  area: AreaColorKey;
  cutDescription: string | null;
  /** Cut for 2027 in euros – the value that counts for the total. */
  amount: number | null;
  amountKind: AmountKind | null;
  amountSource: string | null;
  /** Free text for later years, e.g. "2028: 85.000 €, 2029: 120.000 €". */
  amountLater: string | null;
  /** Free text, e.g. "10 %". */
  amountPercent: string | null;
  /** What is lost if it is not a sum of money, e.g. "Wegfall der Mietzuschüsse". */
  nonMonetary: string | null;
  consequences: string | null;
  quote: string | null;
  infoLink: string | null;
  /** Project image, or the organisation's logo if the project has none. */
  image: InstitutionImage | null;
  /** True if `image` is the project's own image (not the organisation logo). */
  ownImage: boolean;
  featured: boolean;
}

/** Where to fetch an image from – used only during the build, never published. */
export type ImageRef = { kind: 'drive'; id: string } | { kind: 'sample'; path: string };

export interface OrganisationEntry {
  organisation: Organisation;
  logoRef: ImageRef | null;
  logoCredit: string | null;
}

export interface ProjectEntry {
  project: Project;
  imageRef: ImageRef | null;
  imageCredit: string | null;
}

export type Severity = 'error' | 'warning';

export interface BuildMessage {
  severity: Severity;
  message: string;
}
