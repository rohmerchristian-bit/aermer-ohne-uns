// Open Graph images (1200 × 630) rendered at build time with Satori + resvg.
// Same colours, font (static Archivo instances in src/assets/og-fonts) and logo as the website.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { base, signal } from '../design/colors.ts';

import { OG_HEIGHT, OG_WIDTH } from './og-size.ts';

export { OG_HEIGHT, OG_WIDTH };

const root = process.cwd();
const fontDir = path.join(root, 'src/assets/og-fonts');

type Weight = 400 | 700 | 800 | 900;
const font = (name: string, file: string, weight: Weight) => ({
  name,
  data: readFileSync(path.join(fontDir, file)),
  weight,
  style: 'normal' as const,
});

// Latin first, latin-ext as fallback for rarer letters (ğ, ł, ő …).
const fonts = [
  font('Archivo Condensed', 'Archivo-Condensed-Black.ttf', 900),
  font('Archivo Condensed', 'Archivo-Condensed-Black-ext.ttf', 900),
  font('Archivo SemiCondensed', 'Archivo-SemiCondensed-ExtraBold.ttf', 800),
  font('Archivo SemiCondensed', 'Archivo-SemiCondensed-ExtraBold-ext.ttf', 800),
  font('Archivo', 'Archivo-Regular.ttf', 400),
  font('Archivo', 'Archivo-Regular-ext.ttf', 400),
  font('Archivo', 'Archivo-Bold.ttf', 700),
  font('Archivo', 'Archivo-Bold-ext.ttf', 700),
];

const logoDataUrl = `data:image/png;base64,${readFileSync(path.join(root, 'public/brand/logo.png')).toString('base64')}`;
const LOGO_RATIO = 1056 / 1200; // height / width of public/brand/logo.png

// ---- tiny element helper (Satori takes React-like objects) ------------------

type Style = Record<string, string | number>;
interface Node {
  type: string;
  props: { style?: Style; children?: Child | Child[]; src?: string; width?: number; height?: number };
}
type Child = Node | string;

function el(type: string, style: Style, children?: Child | Child[]): Node {
  return { type, props: { style: { display: 'flex', ...style }, children } };
}

function logo(width: number): Node {
  return {
    type: 'img',
    props: { src: logoDataUrl, width, height: Math.round(width * LOGO_RATIO), style: {} },
  };
}

/** Pick a font size so that long titles still fit into the given number of lines. */
export function fitFontSize(text: string, sizes: Array<[maxChars: number, size: number]>, fallback: number): number {
  return sizes.find(([max]) => text.length <= max)?.[1] ?? fallback;
}

async function render(tree: Node): Promise<Buffer> {
  // Satori's own types expect React elements; our plain objects have the same shape.
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
  return sharp(png).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
}

// ---- Layouts ------------------------------------------------------------------

export interface PageCard {
  /** Small uppercase label, e.g. "Hintergrund". */
  kicker: string;
  /** Big headline, e.g. "Worum es geht" or a total like "280.000 €". */
  title: string;
  /** One or two lines below the headline. */
  text?: string;
}

/** Neon logo block on the left, headline on paper on the right. */
export function pageImage({ kicker, title, text }: PageCard): Promise<Buffer> {
  const titleSize = fitFontSize(title, [[12, 132], [20, 104], [32, 84], [48, 68]], 56);
  return render(
    el('div', { width: OG_WIDTH, height: OG_HEIGHT, backgroundColor: base.paper, color: base.ink }, [
      el(
        'div',
        {
          width: 470,
          height: OG_HEIGHT,
          flexShrink: 0,
          backgroundColor: signal,
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: `8px solid ${base.ink}`,
        },
        logo(360),
      ),
      el('div', { flexDirection: 'column', justifyContent: 'space-between', padding: '56px 60px', flex: 1 }, [
        el('div', { flexDirection: 'column' }, [
          el(
            'div',
            { fontFamily: 'Archivo', fontWeight: 700, fontSize: 26, letterSpacing: 2.5, textTransform: 'uppercase' },
            kicker,
          ),
          el(
            'div',
            {
              marginTop: 22,
              fontFamily: 'Archivo Condensed',
              fontWeight: 900,
              fontSize: titleSize,
              lineHeight: 0.95,
              letterSpacing: -1,
            },
            title,
          ),
          ...(text
            ? [
                el(
                  'div',
                  { marginTop: 26, fontFamily: 'Archivo SemiCondensed', fontWeight: 800, fontSize: 34, lineHeight: 1.2 },
                  text,
                ),
              ]
            : []),
        ]),
        el('div', { fontFamily: 'Archivo', fontWeight: 700, fontSize: 28 }, '#ÄrmerOhneUns · Erlangen'),
      ]),
    ]),
  );
}

export interface OrganisationCard {
  name: string;
  /** Area labels of the organisation's projects, e.g. "Kultur & Kunst · Kinder & Jugend". */
  areas: string;
  /** Background and text colour of the main area. */
  background: string;
  foreground: string;
  /** e.g. "−82.000 €" or null if no amount is known. */
  amount: string | null;
  /** e.g. "4 betroffene Projekte · im Jahr 2027". */
  summary: string;
}

/** Full area-colour card with the organisation name, the cut and the logo on neon. */
export function organisationImage(card: OrganisationCard): Promise<Buffer> {
  const nameSize = fitFontSize(card.name, [[18, 100], [30, 80], [48, 62], [72, 50]], 42);
  return render(
    el(
      'div',
      {
        // Satori adds padding on top of the size, so the root has none; offsets below are from the image edges.
        position: 'relative',
        width: OG_WIDTH,
        height: OG_HEIGHT,
        backgroundColor: card.background,
        color: card.foreground,
      },
      [
        el('div', { position: 'absolute', left: 60, top: 52, width: 1000, flexDirection: 'column' }, [
          el(
            'div',
            { fontFamily: 'Archivo', fontWeight: 700, fontSize: 24, letterSpacing: 2.5, textTransform: 'uppercase' },
            card.areas,
          ),
          el(
            'div',
            {
              marginTop: 18,
              fontFamily: 'Archivo Condensed',
              fontWeight: 900,
              fontSize: nameSize,
              lineHeight: 0.95,
              letterSpacing: -1,
            },
            card.name,
          ),
        ]),
        // Bottom area is pinned, so a long name can never push it out of the image.
        el('div', { position: 'absolute', left: 60, bottom: 48, flexDirection: 'column', maxWidth: 860 }, [
          ...(card.amount
            ? [
                el(
                  'div',
                  { fontFamily: 'Archivo Condensed', fontWeight: 900, fontSize: 124, lineHeight: 0.9, letterSpacing: -2 },
                  card.amount,
                ),
              ]
            : []),
          el('div', { marginTop: 14, fontFamily: 'Archivo SemiCondensed', fontWeight: 800, fontSize: 32 }, card.summary),
        ]),
        el(
          'div',
          {
            position: 'absolute',
            right: 60,
            bottom: 48,
            width: 190,
            height: 190,
            backgroundColor: signal,
            border: `6px solid ${base.ink}`,
            alignItems: 'center',
            justifyContent: 'center',
          },
          logo(150),
        ),
      ],
    ),
  );
}
