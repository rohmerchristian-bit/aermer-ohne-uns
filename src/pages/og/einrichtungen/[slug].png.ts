import type { APIRoute, GetStaticPaths } from 'astro';
import { organisationImage } from '../../../lib/og.ts';
import { organisationCard } from '../../../data/organisation-card.ts';
import { organisations } from '../../../data/index.ts';

// /og/einrichtungen/<slug>.png – share image for each organisation page.
export const getStaticPaths: GetStaticPaths = () => organisations.map((o) => ({ params: { slug: o.slug } }));

export const GET: APIRoute = async ({ params }) => {
  const png = await organisationImage(organisationCard(params.slug!));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
