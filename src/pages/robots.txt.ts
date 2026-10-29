import type { APIRoute } from 'astro';
import { robotsTxt } from '../data/sitemap.ts';
import { url } from '../lib/paths.ts';

// /robots.txt: everything allowed except the internal area; the preview stays out of search engines.

export const GET: APIRoute = ({ site }) =>
  new Response(
    robotsTxt({
      preview: process.env.PREVIEW === '1',
      sitemapUrl: new URL(url('/sitemap.xml'), site).toString(),
      internPath: url('/intern/'),
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
