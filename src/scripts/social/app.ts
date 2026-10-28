// Social post creator (/intern/): pick format, template and content, adjust the texts,
// save as PNG. Everything runs in the browser; nothing is sent anywhere.

import { getFontEmbedCSS, toBlob } from 'html-to-image';
import { formatCut } from '../../lib/format.ts';
import { fitText, getTemplate, SIZE, templates, type FieldId, type Fields, type Format, type Template } from './templates.ts';
import { canPickFolder, loadFolder, pickFolder, saveAsDownload, saveToFolder, today, type FolderHandle, type Output } from './save.ts';

interface ProjectData {
  id: string;
  org: string;
  name: string;
  area: string;
  amount: number | null;
  nonMonetary: string | null;
  quote: string | null;
  consequences: string | null;
  image: string | null;
  credit: string;
  logo: boolean;
}

interface Measure {
  referat: string;
  amt: string;
  nr: string;
  title: string;
  amounts: number[];
  note: string;
}

interface Data {
  amountYear: number;
  logo: string;
  areas: { slug: string; label: string }[];
  projects: ProjectData[];
  referate: { id: string; name: string | null }[];
  savings: Measure[];
}

const SAVINGS_YEARS = [2026, 2027, 2028, 2029, 2030];

const FIELD_UI: Record<FieldId, { label: string; kind: 'text' | 'textarea' | 'area' | 'image'; hint?: string }> = {
  area: { label: 'Farbe (Bereich)', kind: 'area' },
  kicker: { label: 'Kleine Überschrift', kind: 'text' },
  title: { label: 'Titel', kind: 'textarea', hint: 'Mit Enter eine neue Zeile beginnen.' },
  subtitle: { label: 'Unterzeile', kind: 'text' },
  year: { label: 'Jahr der Kürzung', kind: 'text', hint: 'Leer lassen, um den Jahres-Reiter auszublenden.' },
  amount: { label: 'Betrag', kind: 'text' },
  quote: { label: 'Zitat', kind: 'textarea', hint: 'Ohne Anführungszeichen – die setzt die Vorlage.' },
  text: { label: 'Text', kind: 'textarea' },
  image: { label: 'Bild', kind: 'image' },
  logo: { label: '', kind: 'text' },
  credit: { label: 'Bildnachweis', kind: 'text' },
  stamp: { label: 'Stempel', kind: 'text' },
  source: { label: 'Quelle', kind: 'text' },
  cta: { label: 'Hinweis unten', kind: 'text', hint: 'z. B. Hashtag oder Link. Leer lassen zum Ausblenden.' },
};

const EMPTY: Fields = {
  area: 'kultur', kicker: '', title: '', subtitle: '', year: '', amount: '', quote: '', text: '',
  image: '', credit: '', stamp: '', source: '', cta: '', logo: '',
};

const $ = <T extends Element>(root: ParentNode, selector: string) => root.querySelector<T>(selector)!;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function start(): void {
  const found = document.querySelector<HTMLElement>('[data-social]');
  if (!found) return;
  const root: HTMLElement = found;
  const data = JSON.parse(document.getElementById('social-data')!.textContent!) as Data;
  const areaLabel = (slug: string) => data.areas.find((a) => a.slug === slug)?.label ?? '';

  // ---- state ----
  const state = {
    format: 'post' as Format,
    template: { post: 'P1', story: 'S1' } as Record<Format, string>,
    projectId: data.projects[0]?.id ?? '',
    measure: Math.max(0, data.savings.findIndex((m) => m.referat === 'IV')),
    /** Texts per template, so switching templates never loses edits. */
    fields: {} as Record<string, Fields>,
    folder: null as FolderHandle | null,
  };
  const current = () => getTemplate(state.template[state.format]);
  const project = () => data.projects.find((p) => p.id === state.projectId);

  // ---- default texts ----
  function projectFields(tpl: Template, p: ProjectData): Fields {
    const amount = p.amount !== null ? formatCut(p.amount) : (p.nonMonetary ?? 'Betrag folgt');
    const subtitle = p.name !== p.org ? p.org : '';
    const base: Fields = {
      ...EMPTY,
      area: p.area,
      kicker: areaLabel(p.area),
      title: p.name,
      subtitle,
      year: p.amount !== null ? String(data.amountYear) : '',
      amount,
      quote: p.quote ?? '',
      text: p.consequences ?? '',
      image: p.image ?? '',
      credit: p.credit,
      logo: p.logo ? '1' : '',
    };
    switch (tpl.id) {
      case 'P1':
        return { ...base, cta: '#ÄrmerOhneUns · aermerohneuns.de' };
      case 'P2':
        return { ...base, subtitle: p.org, amount: p.amount !== null ? amount : '' };
      case 'S1':
        return { ...base, cta: 'Mehr auf aermerohneuns.de' };
      case 'S2':
        return { ...base, kicker: p.org, cta: '#ÄrmerOhneUns' };
      default:
        return base;
    }
  }

  function savingsFields(m: Measure): Fields {
    // The 2027 amount if there is one, otherwise the first year with an amount.
    const order = [1, 2, 3, 4, 0];
    const index = order.find((i) => (m.amounts[i] ?? 0) > 0) ?? 1;
    const note = m.note.length > 260 ? `${m.note.slice(0, 257).replace(/\s+\S*$/, '')} …` : m.note;
    return {
      ...EMPTY,
      stamp: 'Steht auf der Sparliste',
      kicker: `Referat ${m.referat} · Amt ${m.amt} · Nr. ${m.nr}`,
      title: m.title,
      amount: (m.amounts[index] ?? 0) > 0 ? formatCut(m.amounts[index]!) : '–',
      year: String(SAVINGS_YEARS[index]),
      text: note,
      source: 'Quelle: Stadt Erlangen, Übersicht Einsparmöglichkeiten – Ergebnishaushalt',
    };
  }

  function freeFields(tpl: Template): Fields {
    if (tpl.id === 'P4') {
      return {
        ...EMPTY,
        title: '29 Mio. €',
        text: 'weniger für Bildung, Familien, Kinder & Jugend, Kultur und Sport.',
        cta: 'Erlangen · Haushalt bis 2029 · #ÄrmerOhneUns',
      };
    }
    return {
      ...EMPTY,
      kicker: 'Kundgebung',
      title: 'Mi\n18.11.',
      subtitle: '15:00 Uhr · Rathausplatz Erlangen',
      text: 'Gegen die Kürzungen bei Kultur, Bildung, Jugend und Sozialem. Kommt alle!',
      cta: '#ÄrmerOhneUns',
    };
  }

  function defaults(tpl: Template, p = project()): Fields {
    if (tpl.source === 'savings') return savingsFields(data.savings[state.measure]!);
    if (tpl.source === 'free') return freeFields(tpl);
    return p ? projectFields(tpl, p) : { ...EMPTY };
  }

  const fieldsOf = (tpl: Template) => (state.fields[tpl.id] ??= defaults(tpl));

  // ---- rendering ----
  /** Image boxes have fixed sizes, so fitting the text never waits for images – only the export does. */
  async function renderInto(container: HTMLElement, tpl: Template, fields: Fields, waitForImages = false): Promise<HTMLElement> {
    container.innerHTML = tpl.render(fields, { logo: data.logo });
    const art = container.firstElementChild as HTMLElement;
    art.classList.add(`is-${tpl.format}`);
    // Fonts load only once text needs them: lay out first, then wait, then measure.
    void art.offsetHeight;
    await document.fonts.ready;
    fitText(art);
    if (waitForImages) {
      const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
      await Promise.race([Promise.all([...art.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined))), timeout]);
    }
    return art;
  }

  const preview = $<HTMLElement>(root, '[data-preview]');
  const frame = $<HTMLElement>(root, '[data-frame]');
  let renderToken = 0;

  async function renderPreview(): Promise<void> {
    const token = ++renderToken;
    const tpl = current();
    const size = SIZE[tpl.format];
    // Fit the preview into the available space (width of the column, height of the window).
    const available = Math.min(frame.parentElement!.clientWidth - 12, 560);
    const scale = Math.min(available / size.width, (window.innerHeight - 140) / size.height, 0.6);
    frame.style.width = `${Math.round(size.width * scale)}px`;
    frame.style.height = `${Math.round(size.height * scale)}px`;
    frame.style.setProperty('--safe', `${Math.round(250 * scale)}px`);
    preview.style.transform = `scale(${scale})`;
    await renderInto(preview, tpl, fieldsOf(tpl));
    if (token !== renderToken) return;
    $<HTMLElement>(root, '[data-size]').textContent = `${size.label} · ${size.width} × ${size.height} px · ${tpl.id} „${tpl.name}“`;
  }

  // ---- controls ----
  const templateBox = $<HTMLElement>(root, '[data-templates]');
  const sourceBox = $<HTMLElement>(root, '[data-source]');
  const fieldBox = $<HTMLElement>(root, '[data-fields]');
  const status = $<HTMLElement>(root, '[data-status]');
  const saveAll = $<HTMLButtonElement>(root, '[data-save-all]');

  function renderTemplates(): void {
    templateBox.innerHTML = templates
      .filter((tpl) => tpl.format === state.format)
      .map(
        (tpl) => `<label class="card"><input type="radio" name="template" value="${tpl.id}" ${
          tpl.id === current().id ? 'checked' : ''
        }><span><b>${tpl.id} ${esc(tpl.name)}</b>${esc(tpl.description)}</span></label>`,
      )
      .join('');
  }

  function renderSource(): void {
    const tpl = current();
    if (tpl.source === 'project') {
      const groups = new Map<string, ProjectData[]>();
      for (const p of data.projects) groups.set(p.org, [...(groups.get(p.org) ?? []), p]);
      sourceBox.innerHTML = `<label class="field"><span>Projekt</span><select data-project>${[...groups]
        .map(
          ([org, list]) =>
            `<optgroup label="${esc(org)}">${list
              .map((p) => `<option value="${p.id}" ${p.id === state.projectId ? 'selected' : ''}>${esc(p.name)}</option>`)
              .join('')}</optgroup>`,
        )
        .join('')}</select></label><p class="hint">Texte, Farbe und Bild werden aus dem Eintrag übernommen.</p>`;
    } else if (tpl.source === 'savings') {
      sourceBox.innerHTML = `<label class="field"><span>Maßnahme aus der Sparliste</span><select data-measure>${data.referate
        .map(
          (r) =>
            `<optgroup label="Referat ${r.id}${r.name ? ` · ${esc(r.name)}` : ''}">${data.savings
              .map((m, i) =>
                m.referat === r.id
                  ? `<option value="${i}" ${i === state.measure ? 'selected' : ''}>${esc(`${m.nr}. ${m.title}`.slice(0, 90))}</option>`
                  : '',
              )
              .join('')}</optgroup>`,
        )
        .join('')}</select></label>`;
    } else {
      sourceBox.innerHTML = '<p class="hint">Freie Vorlage – einfach die Texte unten eintragen.</p>';
    }
    saveAll.hidden = tpl.source !== 'project';
  }

  function renderFields(): void {
    const tpl = current();
    const f = fieldsOf(tpl);
    fieldBox.innerHTML = tpl.fields
      .map((id) => {
        const ui = FIELD_UI[id];
        const hint = ui.hint ? `<span class="hint">${ui.hint}</span>` : '';
        if (ui.kind === 'area') {
          return `<label class="field"><span>${ui.label}</span><select data-field="area">${data.areas
            .map((a) => `<option value="${a.slug}" ${a.slug === f.area ? 'selected' : ''}>${esc(a.label)}</option>`)
            .join('')}</select></label>`;
        }
        if (ui.kind === 'image') {
          return `<div class="field"><span>${ui.label}</span><div class="imgfield">${
            f.image ? `<img src="${esc(f.image)}" alt="">` : '<img alt="">'
          }<div><input type="file" accept="image/*" data-upload aria-label="Eigenes Bild hochladen"><p class="hint">Eigenes Foto hochladen – es bleibt auf diesem Computer.</p>${
            project()?.image && tpl.source === 'project'
              ? '<button type="button" class="linkbtn" data-project-image>Bild aus dem Eintrag verwenden</button>'
              : ''
          }</div></div></div>`;
        }
        const input =
          ui.kind === 'textarea'
            ? `<textarea data-field="${id}" rows="3">${esc(f[id])}</textarea>`
            : `<input type="text" data-field="${id}" value="${esc(f[id])}">`;
        return `<label class="field"><span>${ui.label}</span>${input}${hint}</label>`;
      })
      .join('');
  }

  function renderAll(): void {
    renderTemplates();
    renderSource();
    renderFields();
    $<HTMLElement>(root, '[data-safe-toggle]').hidden = state.format !== 'story';
    void renderPreview();
  }

  // Typing updates the preview right away (a frame later, so fast typing stays smooth).
  let pending = 0;
  const schedulePreview = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => void renderPreview());
  };

  root.addEventListener('input', (event) => {
    const el = event.target as HTMLInputElement;
    const tpl = current();
    if (el.name === 'format') {
      state.format = el.value as Format;
      status.textContent = '';
      renderAll();
    } else if (el.name === 'template') {
      state.template[state.format] = el.value;
      status.textContent = '';
      renderSource();
      renderFields();
      void renderPreview();
    } else if (el.matches('[data-field]')) {
      fieldsOf(tpl)[el.dataset.field as FieldId] = el.value;
      schedulePreview();
    }
  });

  root.addEventListener('change', (event) => {
    const el = event.target as HTMLInputElement | HTMLSelectElement;
    if (el.matches('[data-project]')) {
      state.projectId = el.value;
      // A new project refills every project template (edits belong to the old project).
      for (const tpl of templates) if (tpl.source === 'project') delete state.fields[tpl.id];
      renderFields();
      void renderPreview();
    } else if (el.matches('[data-measure]')) {
      state.measure = Number(el.value);
      delete state.fields.S4;
      renderFields();
      void renderPreview();
    } else if (el.matches('[data-upload]')) {
      const file = (el as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const f = fieldsOf(current());
        f.image = String(reader.result);
        f.credit = '';
        f.logo = '';
        renderFields();
        void renderPreview();
      };
      reader.readAsDataURL(file);
    } else if (el.matches('[data-safe]')) {
      frame.classList.toggle('show-safe', (el as HTMLInputElement).checked);
    }
  });

  root.addEventListener('click', (event) => {
    const el = event.target as HTMLElement;
    if (el.matches('[data-reset]')) {
      delete state.fields[current().id];
      renderFields();
      void renderPreview();
    } else if (el.matches('[data-project-image]')) {
      const p = project();
      const f = fieldsOf(current());
      f.image = p?.image ?? '';
      f.credit = p?.credit ?? '';
      f.logo = p?.logo ? '1' : '';
      renderFields();
      void renderPreview();
    } else if (el.matches('[data-pick-folder]')) {
      void pickFolder().then((folder) => {
        if (folder) state.folder = folder;
        renderFolderInfo();
      });
    } else if (el.matches('[data-forget-folder]')) {
      state.folder = null;
      renderFolderInfo();
    }
  });

  // ---- saving ----
  const folderInfo = $<HTMLElement>(root, '[data-folder-info]');
  function renderFolderInfo(): void {
    if (!canPickFolder) {
      folderInfo.innerHTML =
        'Bilder werden heruntergeladen (mehrere als ZIP mit Projektordner). Direkt in den Drive-Ordner speichern geht in Chrome oder Edge.';
    } else if (state.folder) {
      folderInfo.innerHTML = `Speichert in <strong>${esc(state.folder.name)}</strong> → ein Unterordner pro Projekt. <button type="button" class="linkbtn" data-pick-folder>Anderen Ordner wählen</button> · <button type="button" class="linkbtn" data-forget-folder>Nur herunterladen</button>`;
    } else {
      folderInfo.innerHTML =
        'Noch kein Ordner gewählt – Bilder werden heruntergeladen. <button type="button" class="linkbtn" data-pick-folder>Drive-Ordner wählen …</button>';
    }
  }

  /** Folder name for the current content: the project, "Sparliste" or "Allgemein". */
  function folderName(tpl: Template): string {
    if (tpl.source === 'project') {
      const p = project();
      return p ? (p.name === p.org ? p.org : `${p.org} – ${p.name}`) : 'Allgemein';
    }
    return tpl.source === 'savings' ? 'Sparliste' : 'Allgemein';
  }

  const stage = $<HTMLElement>(root, '[data-stage]');
  // Embedding the web fonts is the slow part of an export, so it is done once per visit.
  let fontEmbedCSS: string | undefined;
  async function exportPng(tpl: Template): Promise<Output> {
    const art = await renderInto(stage, tpl, fieldsOf(tpl), true);
    const { width, height } = SIZE[tpl.format];
    fontEmbedCSS ??= await getFontEmbedCSS(art);
    const blob = await toBlob(art, { width, height, pixelRatio: 1, cacheBust: false, fontEmbedCSS });
    stage.innerHTML = '';
    if (!blob) throw new Error('Bild konnte nicht erzeugt werden.');
    return { name: `${today()}_${tpl.id}-${tpl.name.replace(/\W+/g, '-')}.png`, blob };
  }

  async function save(list: Template[]): Promise<void> {
    const withoutImage = list.find((tpl) => tpl.fields.includes('image') && !fieldsOf(tpl).image);
    if (withoutImage) {
      status.textContent = `Für „${withoutImage.name}“ fehlt noch ein Bild – bitte unter „Bild“ eines hochladen.`;
      return;
    }
    const buttons = root.querySelectorAll<HTMLButtonElement>('[data-save], [data-save-all]');
    buttons.forEach((b) => (b.disabled = true));
    status.textContent = list.length > 1 ? `Erstelle ${list.length} Bilder …` : 'Erstelle Bild …';
    try {
      const files: Output[] = [];
      for (const tpl of list) files.push(await exportPng(tpl));
      const folder = folderName(list[0]!);
      if (state.folder && (await saveToFolder(state.folder, folder, files))) {
        status.textContent = `Gespeichert: ${files.length} ${files.length === 1 ? 'Bild' : 'Bilder'} in „${state.folder.name}/${folder}“.`;
      } else {
        await saveAsDownload(folder, files);
        status.textContent = files.length === 1 ? 'Bild heruntergeladen.' : `ZIP mit ${files.length} Bildern heruntergeladen.`;
      }
    } catch (error) {
      status.textContent = `Fehler: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  }

  $<HTMLButtonElement>(root, '[data-save]').addEventListener('click', () => void save([current()]));
  // Quote and photo layouts are skipped if the project has no quote or image (S1 works without a quote).
  const QUOTE_LAYOUTS = ['P2', 'S2'];
  saveAll.addEventListener('click', () => {
    if (!project()) return;
    const list = templates.filter((tpl) => {
      if (tpl.source !== 'project') return false;
      const f = fieldsOf(tpl);
      if (QUOTE_LAYOUTS.includes(tpl.id) && !f.quote.trim()) return false;
      return !(tpl.fields.includes('image') && !f.image);
    });
    void save(list);
  });

  window.addEventListener('resize', schedulePreview);

  void loadFolder().then((folder) => {
    if (folder) state.folder = folder;
    renderFolderInfo();
  });
  renderFolderInfo();
  renderAll();
}
