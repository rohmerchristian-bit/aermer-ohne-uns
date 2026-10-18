// Filter, sort and search for /einrichtungen/. State lives in the URL
// (?bereich=kultur,bildung&sort=betrag&suche=theater) so filtered views can be shared.

import { formatEuro } from '../lib/format.ts';

type Sort = 'empfohlen' | 'betrag' | 'name';
const SORTS: Sort[] = ['empfohlen', 'betrag', 'name'];

interface State {
  areas: string[];
  sort: Sort;
  query: string;
}

function readState(validAreas: Set<string>): State {
  const params = new URLSearchParams(location.search);
  const areas = params
    .getAll('bereich')
    .flatMap((v) => v.split(','))
    .map((v) => v.trim().toLowerCase())
    .filter((v) => validAreas.has(v));
  const sort = SORTS.find((s) => s === params.get('sort')) ?? 'empfohlen';
  return { areas: [...new Set(areas)], sort, query: params.get('suche') ?? '' };
}

function writeState(state: State): void {
  const params = new URLSearchParams();
  if (state.areas.length) params.set('bereich', state.areas.join(','));
  if (state.sort !== 'empfohlen') params.set('sort', state.sort);
  if (state.query.trim()) params.set('suche', state.query.trim());
  const search = params.toString();
  history.replaceState(null, '', search ? `?${search}` : location.pathname);
}

/** "Bürgerhaus", "Buergerhaus" and "Burgerhaus" all match each other. */
export function normalize(text: string): string {
  return text
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/([aou])e/g, '$1');
}

export function initFilter(): void {
  const form = document.querySelector<HTMLFormElement>('[data-filter-controls]');
  const list = document.querySelector<HTMLUListElement>('[data-filter-list]');
  const status = document.querySelector<HTMLElement>('[data-filter-status]');
  const empty = document.querySelector<HTMLElement>('[data-filter-empty]');
  if (!form || !list || !status) return;

  const items = [...list.querySelectorAll<HTMLLIElement>(':scope > li')];
  const original = new Map(items.map((li, i) => [li, i]));
  const checkboxes = [...form.querySelectorAll<HTMLInputElement>('input[name="bereich"]')];
  const sortSelect = form.querySelector<HTMLSelectElement>('select[name="sort"]');
  const searchInput = form.querySelector<HTMLInputElement>('input[name="suche"]');
  const reset = form.querySelector<HTMLButtonElement>('[data-filter-reset]');

  const validAreas = new Set(checkboxes.map((c) => c.value));
  const initial = readState(validAreas);
  checkboxes.forEach((c) => (c.checked = initial.areas.includes(c.value)));
  if (sortSelect) sortSelect.value = initial.sort;
  if (searchInput) searchInput.value = initial.query;

  const apply = (updateUrl: boolean) => {
    const state: State = {
      areas: checkboxes.filter((c) => c.checked).map((c) => c.value),
      sort: (SORTS.find((s) => s === sortSelect?.value) ?? 'empfohlen') as Sort,
      query: searchInput?.value ?? '',
    };
    const terms = normalize(state.query).split(/\s+/).filter(Boolean);

    let count = 0;
    let sum = 0;
    for (const li of items) {
      const areaOk = state.areas.length === 0 || state.areas.includes(li.dataset.area ?? '');
      const haystack = normalize(li.dataset.search ?? '');
      const queryOk = terms.every((t) => haystack.includes(t));
      const visible = areaOk && queryOk;
      li.hidden = !visible;
      if (visible) {
        count++;
        sum += Number(li.dataset.amount || 0);
      }
    }

    const sorted = [...items].sort((a, b) => {
      if (state.sort === 'betrag') return Number(b.dataset.amount || -1) - Number(a.dataset.amount || -1);
      if (state.sort === 'name') return (a.dataset.name ?? '').localeCompare(b.dataset.name ?? '', 'de');
      return original.get(a)! - original.get(b)!;
    });
    // Only touch the DOM if the order actually changed (keeps focus and avoids reflow).
    if (sorted.some((li, i) => list.children[i] !== li)) list.append(...sorted);

    const noun = count === 1 ? 'Einrichtung' : 'Einrichtungen';
    status.textContent =
      sum > 0 ? `${count} ${noun}, zusammen ${formatEuro(sum)} pro Jahr` : `${count} ${noun}`;
    if (empty) empty.hidden = count > 0;
    if (reset) reset.hidden = state.areas.length === 0 && !terms.length && state.sort === 'empfohlen';
    if (updateUrl) writeState(state);
  };

  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', () => apply(true));
  let timer: number | undefined;
  searchInput?.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => apply(true), 150);
  });
  reset?.addEventListener('click', () => {
    checkboxes.forEach((c) => (c.checked = false));
    if (sortSelect) sortSelect.value = 'empfohlen';
    if (searchInput) searchInput.value = '';
    apply(true);
    searchInput?.focus();
  });

  apply(false);
}
