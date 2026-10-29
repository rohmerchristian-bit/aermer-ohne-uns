import { describe, expect, it } from 'vitest';
import { robotsTxt, sitemapPaths, sitemapXml } from '../src/data/sitemap.ts';

describe('sitemap', () => {
  it('lists the public pages and one page per organisation, never internal pages', () => {
    const paths = sitemapPaths({ organisationSlugs: ['kulturzentrum-e-werk'], comingSoon: false });
    expect(paths).toContain('/');
    expect(paths).toContain('/spenden/');
    expect(paths).toContain('/einrichtungen/kulturzentrum-e-werk/');
    for (const hidden of ['/intern/', '/styleguide/', '/demnaechst/', '/404/']) expect(paths).not.toContain(hidden);
  });

  it('lists only the start page in coming-soon mode', () => {
    expect(sitemapPaths({ organisationSlugs: ['a'], comingSoon: true })).toEqual(['/']);
  });

  it('writes valid sitemap XML with escaped URLs', () => {
    const xml = sitemapXml(['https://aermerohneuns.de/?a=1&b=2'], '2026-10-29');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://aermerohneuns.de/?a=1&amp;b=2</loc><lastmod>2026-10-29</lastmod>');
  });
});

describe('robots.txt', () => {
  it('allows the site, blocks /intern/ and points to the sitemap', () => {
    const txt = robotsTxt({ preview: false, sitemapUrl: 'https://aermerohneuns.de/sitemap.xml', internPath: '/intern/' });
    expect(txt).toContain('Disallow: /intern/');
    expect(txt).toContain('Sitemap: https://aermerohneuns.de/sitemap.xml');
    expect(txt).not.toMatch(/^Disallow: \/$/m);
  });

  it('keeps the public preview out of search engines', () => {
    const txt = robotsTxt({ preview: true, sitemapUrl: 'x', internPath: '/intern/' });
    expect(txt).toMatch(/^Disallow: \/$/m);
    expect(txt).not.toContain('Sitemap:');
  });
});
