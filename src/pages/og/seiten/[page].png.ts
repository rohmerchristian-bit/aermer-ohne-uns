import type { APIRoute, GetStaticPaths } from 'astro';
import { pageImage } from '../../../lib/og.ts';
import { pageCard, SHARE_PAGES, type SharePage } from '../../../data/share.ts';

// /og/seiten/<page>.png – share images for the general pages.
export const getStaticPaths: GetStaticPaths = () => SHARE_PAGES.map((page) => ({ params: { page } }));

export const GET: APIRoute = async ({ params }) => {
  const png = await pageImage(pageCard(params.page as SharePage));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
