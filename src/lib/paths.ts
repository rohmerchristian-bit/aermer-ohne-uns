// All internal links and asset paths go through these helpers, so the site works both at the
// domain root (E-Werk server) and in a sub-folder (GitHub Pages preview: /aermer-ohne-uns/).
// The base is set with BASE_PATH at build time (astro.config.mjs).

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** "/einrichtungen/" → "/aermer-ohne-uns/einrichtungen/" (or unchanged at the root). */
export function url(path: string): string {
  return BASE + path.replace(/^\//, '');
}

/** Applies the base to every root-relative URL in a srcset ("/media/a.webp 480w, /media/b.webp 800w"). */
export function srcsetUrl(srcset: string): string {
  return srcset.replace(/(^|,\s*)\//g, `$1${BASE}`);
}

/** Path of the current page without the base, for comparing with "/einrichtungen/". */
export function stripBase(pathname: string): string {
  return pathname.startsWith(BASE) ? `/${pathname.slice(BASE.length)}` : pathname;
}
