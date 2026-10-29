// Pages listed in /sitemap.xml and the rules in /robots.txt.
// Paths are root-relative without the base (the endpoints add base and domain).

/** Public pages; organisation pages are added from the data. */
const STATIC_PATHS = ['/', '/einrichtungen/', '/hintergrund/', '/spenden/', '/mitmachen/', '/impressum/', '/datenschutz/'];

export interface SitemapOptions {
  organisationSlugs: string[];
  /** COMING_SOON=1: only the start page is online. */
  comingSoon: boolean;
}

export function sitemapPaths({ organisationSlugs, comingSoon }: SitemapOptions): string[] {
  if (comingSoon) return ['/'];
  return [...STATIC_PATHS, ...organisationSlugs.map((slug) => `/einrichtungen/${slug}/`)];
}

export function sitemapXml(urls: string[], lastmod: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((loc) => `  <url><loc>${esc(loc)}</loc><lastmod>${lastmod}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

export interface RobotsOptions {
  /** Public preview (GitHub Pages): keep search engines out entirely. */
  preview: boolean;
  sitemapUrl: string;
  /** Root-relative path of the internal area, with base. */
  internPath: string;
}

export function robotsTxt({ preview, sitemapUrl, internPath }: RobotsOptions): string {
  if (preview) return ['# Vorschau – nicht für Suchmaschinen.', 'User-agent: *', 'Disallow: /', ''].join('\n');
  return ['User-agent: *', `Disallow: ${internPath}`, '', `Sitemap: ${sitemapUrl}`, ''].join('\n');
}
