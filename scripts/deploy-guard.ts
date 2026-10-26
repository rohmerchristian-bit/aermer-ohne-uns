// Safety check before uploading: compares the new build with what is online now.
// Stops the deploy if the number of published projects drops sharply (e.g. the sheet formula broke
// or "Freigeben" was cleared by mistake). Override with DEPLOY_FORCE=1 (workflow input "force").

import { readFile } from 'node:fs/promises';

const SITE_URL = (process.env.SITE_URL ?? '').replace(/\/$/, '');
const MIN_PREVIOUS = 4; // below this, any change is fine
const MAX_DROP = 0.5; // more than half gone → stop

interface Info {
  projects: number;
  comingSoon?: boolean;
}

async function main(): Promise<void> {
  const next = JSON.parse(await readFile('dist/build-info.json', 'utf8')) as Info;
  let previous: Info | null = null;
  try {
    const res = await fetch(`${SITE_URL}/build-info.json?t=${Date.now()}`, { signal: AbortSignal.timeout(15_000) });
    if (res.ok) previous = (await res.json()) as Info;
  } catch {
    // first deploy or site unreachable – nothing to compare
  }

  if (!previous) {
    console.log('Keine vorherige Version online gefunden – keine Prüfung nötig.');
    return;
  }
  console.log(`Online: ${previous.projects} Projekte · neu: ${next.projects} Projekte.`);

  const dropped = previous.projects >= MIN_PREVIOUS && next.projects < previous.projects * (1 - MAX_DROP);
  if (dropped && process.env.DEPLOY_FORCE !== '1') {
    console.error(
      `✖ Die Zahl der Projekte fällt von ${previous.projects} auf ${next.projects}. Das sieht nach einem Fehler im Sheet aus ` +
        '(Formel im Blatt „SHEET_PUBLIC_CSV“, Spalte „Freigeben“). Die Website bleibt unverändert. ' +
        'Wenn das so gewollt ist: Workflow „Deploy“ von Hand mit „force“ starten.',
    );
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(`✖ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
