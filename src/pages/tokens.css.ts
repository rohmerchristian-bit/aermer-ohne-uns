import type { APIRoute } from 'astro';
import { base, signal, textCandidates } from '../design/colors';
import { areas } from '../data/areas';
import { pickTextColor, WCAG_AA_NORMAL } from '../lib/contrast';

// Generates /tokens.css with all colour custom properties from src/design/colors.ts.
// Fails the build if any coloured surface cannot reach WCAG AA with ink or paper text.

function textOn(background: string, name: string): string {
  const { color, ratio } = pickTextColor(background, textCandidates);
  if (ratio < WCAG_AA_NORMAL) {
    throw new Error(
      `Farbe "${name}" (${background}) erreicht mit keiner Textfarbe WCAG AA (bester Wert ${ratio.toFixed(2)}:1).`,
    );
  }
  return color;
}

export const GET: APIRoute = () => {
  const lines = [
    '/* Generated from src/design/colors.ts – do not edit. */',
    ':root {',
    `  --color-ink: ${base.ink};`,
    `  --color-paper: ${base.paper};`,
    `  --color-white: ${base.white};`,
    `  --color-muted: ${base.muted};`,
    `  --color-signal: ${signal};`,
    `  --color-signal-text: ${textOn(signal, 'signal')};`,
    ...areas.flatMap((a) => [
      `  --area-${a.slug}: ${a.color};`,
      `  --area-${a.slug}-text: ${textOn(a.color, a.slug)};`,
    ]),
    '}',
    '',
    // Any element with data-area exposes --area-bg / --area-fg to its children.
    ...areas.map(
      (a) => `[data-area='${a.slug}'] { --area-bg: var(--area-${a.slug}); --area-fg: var(--area-${a.slug}-text); }`,
    ),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
};
