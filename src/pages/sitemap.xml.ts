import type { APIRoute } from 'astro';
import { generatedAt, organisations } from '../data/index.ts';
import { sitemapPaths, sitemapXml } from '../data/sitemap.ts';
import { url } from '../lib/paths.ts';

// /sitemap.xml: all public pages incl. one per organisation. lastmod = last data update.

export const GET: APIRoute = ({ site }) => {
  const paths = sitemapPaths({
    organisationSlugs: organisations.map((o) => o.slug),
    comingSoon: process.env.COMING_SOON === '1',
  });
  const urls = paths.map((path) => new URL(url(path), site).toString());
  return new Response(sitemapXml(urls, generatedAt.slice(0, 10)), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
