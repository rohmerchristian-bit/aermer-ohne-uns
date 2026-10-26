// Prepares dist/ for upload to the web server. Run after `npm run build`.
//
// - writes dist/build-info.json (counts for the safety check of the next deploy)
// - COMING_SOON=1: keeps only the "coming soon" page (as / and as the 404 page), Impressum and
//   Datenschutz (legally required) plus the files they need; all other pages are removed.

import { existsSync } from 'node:fs';
import { readdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const comingSoon = process.env.COMING_SOON === '1';
// Legal pages stay online in coming-soon mode (the imprint requirement applies to it, too).
const KEEP = new Set([path.join('impressum', 'index.html'), path.join('datenschutz', 'index.html')]);

async function main(): Promise<void> {
  if (!existsSync(path.join(dist, 'index.html'))) throw new Error('dist/ fehlt – erst „npm run build“ ausführen.');

  const data = JSON.parse(await readFile(path.join(root, 'src/generated/data.json'), 'utf8')) as {
    projects: unknown[];
    organisations: unknown[];
    total: number;
  };
  const info = {
    builtAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    comingSoon,
    projects: data.projects.length,
    organisations: data.organisations.length,
    total: data.total,
  };

  if (comingSoon) {
    const soon = path.join(dist, 'demnaechst/index.html');
    if (!existsSync(soon)) throw new Error('dist/demnaechst/index.html fehlt.');
    const html = await readFile(soon, 'utf8');

    // Remove every other page (HTML files), keep assets (CSS, JS, fonts, images).
    const removed: string[] = [];
    async function walk(dir: string): Promise<void> {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.name.endsWith('.html') && !KEEP.has(path.relative(dist, full))) {
          await rm(full);
          removed.push(path.relative(dist, full));
        }
      }
    }
    await walk(dist);
    // Empty page folders are left out of the upload by removing them, too.
    for (const dir of ['einrichtungen', 'hintergrund', 'mitmachen', 'styleguide', 'demnaechst', 'og/einrichtungen']) {
      await rm(path.join(dist, dir), { recursive: true, force: true });
    }
    await writeFile(path.join(dist, 'index.html'), html);
    await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'));
    console.log(`Coming-soon-Modus: ${removed.length} Seiten entfernt, online bleiben „startet in Kürze“, Impressum und Datenschutz.`);
  }

  await writeFile(path.join(dist, 'build-info.json'), JSON.stringify(info, null, 2));
  console.log(`build-info.json: ${info.projects} Projekte, ${info.organisations} Einrichtungen${comingSoon ? ' (Coming-soon-Modus)' : ''}.`);
}

main().catch((error: unknown) => {
  console.error(`✖ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
