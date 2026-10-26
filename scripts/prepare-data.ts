// Build step 1: fetch the published sheets, validate them, prepare images and write
// src/generated/*.json for the Astro pages. Run with: npm run data
//
// DATA_SOURCE=sample  → data/sample/*.csv (default, for local development)
// DATA_SOURCE=remote  → SHEET_PUBLIC_CSV_URL / SHEET_SETTINGS_CSV_URL from .env or CI secrets
//
// Exit code 1 means: do not deploy. The live site is never touched by this script.

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataError, runPipeline } from '../src/data/pipeline.ts';
import { DEFAULT_SETTINGS, parseSettings } from '../src/data/settings.ts';
import type { BuildMessage, Organisation, Project } from '../src/data/types.ts';
import { parseCsv } from '../src/lib/csv.ts';
import { imagePaths, processImage, pruneOutput } from '../src/lib/images.ts';
import { formatEuro } from '../src/lib/format.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));

const source = (process.env.DATA_SOURCE ?? 'sample').trim().toLowerCase();
const IMAGE_CONCURRENCY = 4;

async function fetchCsv(url: string, label: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30_000) });
  } catch (error) {
    throw new DataError(`${label} konnte nicht geladen werden (${error instanceof Error ? error.message : error}).`);
  }
  if (!response.ok) throw new DataError(`${label} konnte nicht geladen werden (HTTP ${response.status}).`);
  const type = response.headers.get('content-type') ?? '';
  const body = await response.text();
  if (type.includes('text/html') || body.trimStart().startsWith('<')) {
    throw new DataError(
      `${label}: Google liefert eine Webseite statt einer CSV-Datei. Ist das Blatt über „Datei → Freigeben → Im Web veröffentlichen“ als CSV veröffentlicht?`,
    );
  }
  return body;
}

async function loadTables(messages: BuildMessage[]): Promise<{ publicCsv: string; settingsCsv: string | null }> {
  if (source === 'sample') {
    return {
      publicCsv: await readFile(path.join(root, 'data/sample/oeffentlich.csv'), 'utf8'),
      settingsCsv: await readFile(path.join(root, 'data/sample/einstellungen.csv'), 'utf8'),
    };
  }
  if (source !== 'remote') throw new DataError(`DATA_SOURCE muss „sample“ oder „remote“ sein, nicht „${source}“.`);

  const publicUrl = process.env.SHEET_PUBLIC_CSV_URL?.trim();
  if (!publicUrl) throw new DataError('SHEET_PUBLIC_CSV_URL ist nicht gesetzt (Link zum veröffentlichten Blatt „Öffentlich“).');
  const settingsUrl = process.env.SHEET_SETTINGS_CSV_URL?.trim();
  let settingsCsv: string | null = null;
  if (settingsUrl) {
    settingsCsv = await fetchCsv(settingsUrl, 'Das Blatt „Einstellungen“');
  } else if (existsSync(path.join(root, 'data/einstellungen.csv'))) {
    // Until the "Einstellungen" sheet is published, the real settings live in the repository.
    settingsCsv = await readFile(path.join(root, 'data/einstellungen.csv'), 'utf8');
    messages.push({ severity: 'warning', message: 'Einstellungen kommen aus data/einstellungen.csv (Blatt „Einstellungen“ noch nicht verbunden).' });
  } else {
    messages.push({ severity: 'warning', message: 'SHEET_SETTINGS_CSV_URL ist nicht gesetzt – es gelten die Standard-Einstellungen.' });
  }
  return { publicCsv: await fetchCsv(publicUrl, 'Das Blatt „Öffentlich“'), settingsCsv };
}

async function main(): Promise<void> {
  const messages: BuildMessage[] = [];
  const { publicCsv, settingsCsv } = await loadTables(messages);

  const result = runPipeline(parseCsv(publicCsv), { allowSampleImages: source === 'sample' });
  messages.push(...result.messages);

  const { settings, messages: settingsMessages } = settingsCsv
    ? parseSettings(parseCsv(settingsCsv))
    : { settings: DEFAULT_SETTINGS, messages: [] };
  messages.push(...settingsMessages);

  // Images: failures never stop the build – the tile shows a placeholder instead.
  const paths = imagePaths(root);
  const keep = new Set<string>();
  const imageWarn = (who: string, error: unknown) =>
    messages.push({ severity: 'warning', message: `„${who}“: Bild nicht verwendet – ${error instanceof Error ? error.message : error}` });

  type Job = () => Promise<void>;
  const jobs: Job[] = [];
  for (const entry of result.organisations) {
    if (!entry.logoRef) continue;
    const org = entry.organisation;
    jobs.push(async () => {
      try {
        const { image, files } = await processImage(entry.logoRef!, paths);
        files.forEach((f) => keep.add(f));
        org.logo = { ...image, alt: `Logo von ${org.name}`, credit: entry.logoCredit };
      } catch (error) {
        imageWarn(org.name, error);
      }
    });
  }
  for (const entry of result.projects) {
    if (!entry.imageRef) continue;
    const p = entry.project;
    jobs.push(async () => {
      try {
        const { image, files } = await processImage(entry.imageRef!, paths);
        files.forEach((f) => keep.add(f));
        const alt = image.kind === 'logo' ? `Logo von ${p.name}` : `Foto: ${p.name} (${p.orgName})`;
        p.image = { ...image, alt, credit: entry.imageCredit };
        p.ownImage = true;
        if (!entry.imageCredit && image.kind === 'photo') {
          messages.push({ severity: 'warning', message: `„${p.name}“ (${p.orgName}): Bildnachweis fehlt.` });
        }
      } catch (error) {
        imageWarn(`${p.name} (${p.orgName})`, error);
      }
    });
  }
  await Promise.all(
    Array.from({ length: IMAGE_CONCURRENCY }, async () => {
      for (let job = jobs.shift(); job; job = jobs.shift()) await job();
    }),
  );
  await pruneOutput(paths, keep);

  // Projects without their own image show the organisation logo.
  const organisations: Organisation[] = result.organisations.map((e) => e.organisation);
  const projects: Project[] = result.projects.map((e) => e.project);
  for (const p of projects) {
    if (!p.image) p.image = organisations.find((o) => o.slug === p.orgSlug)?.logo ?? null;
  }

  const total = projects.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const withAmount = projects.filter((p) => p.amount !== null).length;

  const generatedDir = path.join(root, 'src/generated');
  await mkdir(generatedDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  await writeFile(
    path.join(generatedDir, 'data.json'),
    JSON.stringify({ generatedAt, source, total, withAmount, organisations, projects }, null, 2),
  );
  await writeFile(path.join(generatedDir, 'settings.json'), JSON.stringify(settings, null, 2));

  const warnings = messages.filter((m) => m.severity === 'warning');
  const summary =
    `${projects.length} Projekte von ${organisations.length} Einrichtungen veröffentlicht ` +
    `(Summe 2027: ${formatEuro(total)}, ${withAmount} mit Betrag), ${warnings.length} Warnung${warnings.length === 1 ? '' : 'en'}. ` +
    `Nicht freigegeben: ${result.stats.notApproved}, ohne Zustimmung: ${result.stats.noConsent}.`;
  await writeReport({ ok: true, generatedAt, source, summary, stats: result.stats, messages });

  console.log(`\n${summary}`);
  for (const w of warnings) console.log(`  ⚠ ${w.message}`);
  console.log('');
}

async function writeReport(report: object): Promise<void> {
  const dir = path.join(root, '.cache');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'build-report.json'), JSON.stringify(report, null, 2));
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const known = error instanceof DataError;
  await writeReport({ ok: false, generatedAt: new Date().toISOString(), source, summary: message, messages: known ? error.messages : [] });
  const messages = known ? error.messages : [];
  console.error(`\n✖ Daten konnten nicht übernommen werden: ${message}`);
  for (const m of messages) console.error(`  ⚠ ${m.message}`);
  console.error('');
  if (!known) console.error(error);
  process.exit(1);
});
