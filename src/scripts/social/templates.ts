// The eight approved layouts of the social post creator (approved 28.10.2026).
// Each template turns the editable fields into the HTML of one artboard (1080 px wide).
// Styles live in src/styles/social.css; text marked with data-fit shrinks until it fits its box.

export type FieldId =
  | 'area'
  | 'kicker'
  | 'title'
  | 'subtitle'
  | 'year'
  | 'amount'
  | 'quote'
  | 'text'
  | 'image'
  | 'credit'
  | 'stamp'
  | 'source'
  | 'cta'
  /** Not an input: "1" if the image is a logo (shown whole instead of cropped). */
  | 'logo';

export type Fields = Record<FieldId, string>;

export type Format = 'post' | 'story';

/** Where the content of a template comes from. */
export type Source = 'project' | 'savings' | 'free';

export interface Template {
  id: string;
  name: string;
  format: Format;
  source: Source;
  description: string;
  fields: FieldId[];
  render: (f: Fields, assets: Assets) => string;
}

export interface Assets {
  logo: string;
}

export const SIZE: Record<Format, { width: number; height: number; label: string }> = {
  post: { width: 1080, height: 1350, label: 'Post 4:5' },
  story: { width: 1080, height: 1920, label: 'Story 9:16' },
};

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Escaped text with line breaks kept; short hyphenated words ("E-Werk") never break at the hyphen. */
const t = (text: string) =>
  esc(text.trim())
    .replace(/(?<![\p{L}-])([\p{L}\d]{1,3}-[\p{L}\d]{1,8})(?![\p{L}-])/gu, '<span class="nowrap">$1</span>')
    .replace(/\n/g, '<br>');

/** Renders only if the field has text. */
const opt = (text: string, html: (value: string) => string) => (text.trim() ? html(t(text)) : '');

const badge = (a: Assets, extra = '') => `<span class="badge ${extra}"><img src="${a.logo}" alt=""></span>`;
const yearTab = (f: Fields, extra = '') =>
  f.year.trim() ? `<span class="yeartab ${extra}"><span>Kürzung</span><b>${t(f.year)}</b></span>` : '';
const image = (f: Fields, cls: string) =>
  `<div class="${cls}${f.logo ? ' is-logo' : ''}">${f.image ? `<img src="${esc(f.image)}" alt="">` : '<span class="noimg">Bild wählen</span>'}${opt(
    f.credit,
    (v) => `<span class="credit">${v}</span>`,
  )}</div>`;

export const templates: Template[] = [
  {
    id: 'P1',
    name: 'Betrag',
    format: 'post',
    source: 'project',
    description: 'Bereichsfarbe, Kürzung riesig',
    fields: ['area', 'kicker', 'title', 'subtitle', 'year', 'amount', 'cta'],
    render: (f, a) => `
      <div class="art post-amount" data-area="${esc(f.area)}">
        <div class="pa__top"><span class="k">${t(f.kicker)}</span>${badge(a)}</div>
        <div class="pa__name" data-fit="140:70">${t(f.title)}</div>
        ${opt(f.subtitle, (v) => `<div class="pa__org">${v}</div>`)}
        <div class="pa__bottom">
          ${yearTab(f)}
          <div class="pa__amount" data-fit="250:110" data-fit-line>${t(f.amount)}</div>
          ${opt(f.cta, (v) => `<div class="foot">${v}</div>`)}
        </div>
      </div>`,
  },
  {
    id: 'P2',
    name: 'Zitat',
    format: 'post',
    source: 'project',
    description: 'Papierweiß, das Zitat im Mittelpunkt',
    fields: ['area', 'quote', 'subtitle', 'amount', 'year'],
    render: (f, a) => `
      <div class="art post-quote" data-area="${esc(f.area)}">
        <div class="pq__band"></div>
        <div class="pq__mark">„</div>
        <div class="pq__text" data-fit="96:44">${t(f.quote)}</div>
        ${opt(f.subtitle, (v) => `<div class="pq__who">— ${v}</div>`)}
        <div class="pq__bottom">
          ${opt(f.amount, (v) => `<span class="chip">${v}${f.year.trim() ? ` im Jahr ${t(f.year)}` : ''}</span>`)}
          ${badge(a)}
        </div>
      </div>`,
  },
  {
    id: 'P3',
    name: 'Bild + Betrag',
    format: 'post',
    source: 'project',
    description: 'Foto oben, Farbblock mit Kürzung',
    fields: ['area', 'image', 'credit', 'kicker', 'title', 'amount', 'year'],
    render: (f, a) => `
      <div class="art post-photo" data-area="${esc(f.area)}">
        ${image(f, 'pp__img')}
        <div class="pp__block">
          <span class="k">${t(f.kicker)}</span>
          <div class="pp__name" data-fit="110:56">${t(f.title)}</div>
          <div class="pp__amount" data-fit="150:80" data-fit-line>${t(f.amount)}${opt(f.year, (v) => ` <small>im Jahr ${v}</small>`)}</div>
        </div>
        ${badge(a, 'pp__badge')}
      </div>`,
  },
  {
    id: 'P4',
    name: 'Kampagne',
    format: 'post',
    source: 'free',
    description: 'Signalgrün, eine große Zahl oder Aussage',
    fields: ['title', 'text', 'cta'],
    render: (f, a) => `
      <div class="art post-campaign">
        <img class="pc__logo" src="${a.logo}" alt="">
        <div class="pc__big" data-fit="250:90">${t(f.title)}</div>
        ${opt(f.text, (v) => `<div class="pc__text" data-fit="70:36">${v}</div>`)}
        ${opt(f.cta, (v) => `<div class="foot pc__foot">${v}</div>`)}
      </div>`,
  },
  {
    id: 'S1',
    name: 'Betrag',
    format: 'story',
    source: 'project',
    description: 'Bereichsfarbe, Kürzung und kurzes Zitat',
    fields: ['area', 'kicker', 'title', 'subtitle', 'year', 'amount', 'quote', 'cta'],
    render: (f, a) => `
      <div class="art story-amount" data-area="${esc(f.area)}">
        <img class="sa__logo" src="${a.logo}" alt="">
        <span class="k sa__k">${t(f.kicker)}</span>
        <div class="sa__name" data-fit="150:70">${t(f.title)}</div>
        ${opt(f.subtitle, (v) => `<div class="sa__org">${v}</div>`)}
        <div class="sa__money">
          ${yearTab(f)}
          <div class="sa__amount" data-fit="230:110" data-fit-line>${t(f.amount)}</div>
        </div>
        ${opt(f.quote, (v) => `<div class="sa__quote" data-fit="52:30">„${v}“</div>`)}
        ${opt(f.cta, (v) => `<div class="cta">${v}</div>`)}
      </div>`,
  },
  {
    id: 'S2',
    name: 'Bild + Zitat',
    format: 'story',
    source: 'project',
    description: 'Foto oben, Zitat und Kürzung darunter',
    fields: ['area', 'image', 'credit', 'kicker', 'quote', 'year', 'amount', 'cta'],
    render: (f) => `
      <div class="art story-photo" data-area="${esc(f.area)}">
        ${image(f, 'sp__img')}
        <div class="sp__body">
          <span class="k">${t(f.kicker)}</span>
          <div class="sp__quote" data-fit="84:40">${f.quote.trim() ? `„${t(f.quote)}“` : ''}</div>
          <div class="sp__amount">${yearTab(f, 'dark')} <span data-fit="90:50" data-fit-line>${t(f.amount)}</span></div>
        </div>
        ${opt(f.cta, (v) => `<div class="cta">${v}</div>`)}
      </div>`,
  },
  {
    id: 'S3',
    name: 'Termin',
    format: 'story',
    source: 'free',
    description: 'Schwarz und Signalgrün, für Termine und Aktionen',
    fields: ['kicker', 'title', 'subtitle', 'text', 'cta'],
    render: (f, a) => `
      <div class="art story-event">
        <img class="se__logo" src="${a.logo}" alt="">
        <span class="k se__k">${t(f.kicker)}</span>
        <div class="se__date" data-fit="240:100">${t(f.title)}</div>
        ${opt(f.subtitle, (v) => `<div class="se__time">${v}</div>`)}
        ${opt(f.text, (v) => `<div class="se__text" data-fit="48:28">${v}</div>`)}
        ${opt(f.cta, (v) => `<div class="cta se__cta">${v}</div>`)}
      </div>`,
  },
  {
    id: 'S4',
    name: 'Sparliste',
    format: 'story',
    source: 'savings',
    description: 'Ein Punkt der offiziellen Sparliste mit Stempel',
    fields: ['stamp', 'kicker', 'title', 'amount', 'year', 'text', 'source'],
    render: (f, a) => `
      <div class="art story-fact">
        ${opt(f.stamp, (v) => `<span class="stamp">${v}</span>`)}
        <span class="k sf__k">${t(f.kicker)}</span>
        <div class="sf__title" data-fit="130:60">${t(f.title)}</div>
        <div class="sf__amount"><span data-fit="200:100" data-fit-line>${t(f.amount)}</span>${opt(f.year, (v) => `<small>im Jahr ${v}</small>`)}</div>
        ${opt(f.text, (v) => `<div class="sf__note" data-fit="40:26">${v}</div>`)}
        ${opt(f.source, (v) => `<div class="sf__src">${v}</div>`)}
        <img class="sf__logo" src="${a.logo}" alt="">
      </div>`,
  },
];

export const getTemplate = (id: string) => templates.find((tpl) => tpl.id === id) ?? templates[0]!;

/**
 * Shrinks every [data-fit="max:min"] element until its content fits its box.
 * Elements with data-fit-line stay on one line (CSS), so they shrink until they fit the width.
 */
export function fitText(root: HTMLElement): void {
  // All texts start at full size, because they share the space: fitting one at a time would
  // measure the first before the others have grown.
  const items = [...root.querySelectorAll<HTMLElement>('[data-fit]')].map((el) => {
    const [max, min] = el.dataset.fit!.split(':').map(Number) as [number, number];
    el.style.fontSize = `${max}px`;
    return { el, min, size: max };
  });
  // With a line height below 1 (headings) glyphs always stick out of the box a little, so that much
  // overflow is allowed; running text with a normal line height gets no such allowance.
  const overflows = ({ el, size }: (typeof items)[number]) => {
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) / size || 1.2;
    const slack = Math.max(2, size * (1.12 - lineHeight));
    return el.scrollHeight > el.clientHeight + slack || el.scrollWidth > el.clientWidth + 1;
  };
  for (let round = 0; round < 60; round++) {
    const tooBig = items.filter((item) => item.size > item.min && overflows(item));
    if (tooBig.length === 0) break;
    for (const item of tooBig) {
      item.size = Math.max(item.min, Math.floor(item.size * 0.94));
      item.el.style.fontSize = `${item.size}px`;
    }
  }
}
