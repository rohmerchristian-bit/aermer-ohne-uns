// Saving finished images as download: one PNG, or several as a ZIP that contains the project folder.
// (Saving straight into a synced Drive/Teams folder was removed on 29.10.2026; see git history.)

import { zipSync } from 'fflate';

// ---- names ----

/** Safe folder or file name: no slashes or characters Windows/Drive dislike. */
export function safeName(text: string): string {
  return (
    text
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'Ohne Titel'
  );
}

export const today = () => new Date().toLocaleDateString('sv-SE'); // 2026-10-28

export interface Output {
  name: string;
  blob: Blob;
}

function download(blob: Blob, name: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}

/** One file is downloaded as it is, several as a ZIP that contains the project folder. */
export async function saveAsDownload(subfolder: string, files: Output[]): Promise<void> {
  if (files.length === 1) {
    download(files[0]!.blob, `${safeName(subfolder)} – ${files[0]!.name}`);
    return;
  }
  const folder = safeName(subfolder);
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) entries[`${folder}/${file.name}`] = new Uint8Array(await file.blob.arrayBuffer());
  // PNGs are already compressed: store them (level 0) – faster, same size.
  const zip = zipSync(entries, { level: 0 });
  download(new Blob([zip], { type: 'application/zip' }), `${folder}.zip`);
}
