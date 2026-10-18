// Flips institution tiles. Without JavaScript both sides are shown stacked
// (see public/styles/noscript.css), so this script only enhances.

const READY = 'tileReady';

function setFlipped(tile: HTMLElement, flipped: boolean, moveFocus: boolean): void {
  const front = tile.querySelector<HTMLElement>('[data-tile-front]');
  const back = tile.querySelector<HTMLElement>('[data-tile-back]');
  const open = tile.querySelector<HTMLButtonElement>('[data-tile-open]');
  const close = tile.querySelector<HTMLButtonElement>('[data-tile-close]');
  if (!front || !back || !open || !close) return;

  tile.classList.toggle('is-flipped', flipped);
  open.setAttribute('aria-expanded', String(flipped));
  front.inert = flipped;
  back.inert = !flipped;

  if (moveFocus) (flipped ? close : open).focus({ preventScroll: true });
}

function setup(tile: HTMLElement): void {
  if (tile.dataset[READY]) return;
  tile.dataset[READY] = 'true';

  setFlipped(tile, tile.classList.contains('is-flipped'), false);

  // The back image is lazy-loaded; start loading as soon as someone approaches the tile,
  // so it is ready when the card turns.
  const preload = () => tile.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
  tile.addEventListener('pointerenter', preload, { once: true });
  tile.addEventListener('focusin', preload, { once: true });

  tile.querySelector('[data-tile-open]')?.addEventListener('click', () => setFlipped(tile, true, true));
  tile.querySelector('[data-tile-close]')?.addEventListener('click', () => setFlipped(tile, false, true));
  tile.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && tile.classList.contains('is-flipped')) {
      event.preventDefault();
      setFlipped(tile, false, true);
    }
  });
}

export function initTiles(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-tile]').forEach(setup);
}
