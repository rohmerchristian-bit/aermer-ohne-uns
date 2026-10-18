// Downloads institution images at build time and turns them into optimised AVIF/WebP files.
// Visitors only ever load these local files – never Google Drive.
//
// Cache layout:
//   .cache/images/originals/<drive-id>   downloaded originals (Drive uploads never change)
//   public/media/<hash>-<width>.<format> optimised output, reused while the original is unchanged

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp, { type Metadata } from 'sharp';
import type { ImageRef, InstitutionImage } from '../data/types.ts';

const WIDTHS = [480, 800, 1200];
const FALLBACK_WIDTH = 800;
const MAX_BYTES = 20 * 1024 * 1024;
const TIMEOUT_MS = 20_000;

export interface ImagePaths {
  root: string;
  originals: string;
  output: string;
  publicPrefix: string;
  sampleDir: string;
}

export function imagePaths(root: string): ImagePaths {
  return {
    root,
    originals: path.join(root, '.cache/images/originals'),
    output: path.join(root, 'public/media'),
    publicPrefix: '/media/',
    sampleDir: path.join(root, 'data/sample'),
  };
}

export class ImageError extends Error {}

async function downloadDrive(id: string, cacheFile: string): Promise<Buffer> {
  if (existsSync(cacheFile)) return readFile(cacheFile);

  const urls = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`,
  ];
  let lastError = 'unbekannter Fehler';
  for (const url of urls) {
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) {
        lastError =
          response.status === 403 || response.status === 404
            ? `Datei nicht gefunden oder nicht freigegeben (HTTP ${response.status}) – ist der Upload-Ordner auf „Jeder mit dem Link: Betrachter“ gestellt?`
            : `HTTP ${response.status}`;
        continue;
      }
      const type = response.headers.get('content-type') ?? '';
      if (type.includes('text/html')) {
        lastError = 'Google Drive liefert eine HTML-Seite statt des Bildes (Ordner nicht auf „Jeder mit dem Link“ freigegeben?)';
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > MAX_BYTES) throw new ImageError('Bild ist größer als 20 MB.');
      await mkdir(path.dirname(cacheFile), { recursive: true });
      await writeFile(cacheFile, buffer);
      return buffer;
    } catch (error) {
      if (error instanceof ImageError) throw error;
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new ImageError(`Download fehlgeschlagen: ${lastError}`);
}

async function loadOriginal(ref: ImageRef, paths: ImagePaths): Promise<Buffer> {
  if (ref.kind === 'drive') return downloadDrive(ref.id, path.join(paths.originals, ref.id));
  const file = path.resolve(paths.sampleDir, ref.path);
  if (!file.startsWith(paths.sampleDir + path.sep)) throw new ImageError('Ungültiger Pfad.');
  return readFile(file);
}

export interface ProcessedImage {
  image: Omit<InstitutionImage, 'alt' | 'credit'>;
  files: string[];
}

/** Produces AVIF + WebP in several widths. Existing output for the same original is reused. */
export async function processImage(ref: ImageRef, paths: ImagePaths): Promise<ProcessedImage> {
  const original = await loadOriginal(ref, paths);
  const hash = createHash('sha256').update(original).digest('hex').slice(0, 12);

  let meta: Metadata;
  try {
    meta = await sharp(original).metadata();
  } catch {
    throw new ImageError('Datei ist kein lesbares Bild.');
  }
  if (!meta.width || !meta.height) throw new ImageError('Bildgröße nicht lesbar.');

  // EXIF orientation 5–8 swaps width and height.
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  const kind: InstitutionImage['kind'] = meta.hasAlpha ? 'logo' : 'photo';

  const widths = WIDTHS.filter((w) => w < width);
  if (widths.length === 0 || widths[widths.length - 1]! < Math.min(width, WIDTHS[WIDTHS.length - 1]!)) {
    widths.push(Math.min(width, WIDTHS[WIDTHS.length - 1]!));
  }

  await mkdir(paths.output, { recursive: true });
  const files: string[] = [];
  const srcsets: Record<'avif' | 'webp', string[]> = { avif: [], webp: [] };

  for (const w of widths) {
    for (const format of ['avif', 'webp'] as const) {
      const name = `${hash}-${w}.${format}`;
      const target = path.join(paths.output, name);
      if (!existsSync(target)) {
        const pipeline = sharp(original).rotate().resize({ width: w, withoutEnlargement: true });
        const buffer =
          format === 'avif'
            ? await pipeline.avif({ quality: 55, effort: 4 }).toBuffer()
            : await pipeline.webp({ quality: 78 }).toBuffer();
        await writeFile(target, buffer);
      }
      files.push(name);
      srcsets[format].push(`${paths.publicPrefix}${name} ${w}w`);
    }
  }

  const fallbackWidth = widths.includes(FALLBACK_WIDTH) ? FALLBACK_WIDTH : widths[widths.length - 1]!;
  return {
    image: {
      kind,
      src: `${paths.publicPrefix}${hash}-${fallbackWidth}.webp`,
      sources: [
        { type: 'image/avif', srcset: srcsets.avif.join(', ') },
        { type: 'image/webp', srcset: srcsets.webp.join(', ') },
      ],
      width,
      height,
    },
    files,
  };
}

/** Removes optimised files that no current entry uses any more. */
export async function pruneOutput(paths: ImagePaths, keep: Set<string>): Promise<void> {
  if (!existsSync(paths.output)) return;
  for (const name of await readdir(paths.output)) {
    if (!keep.has(name)) await rm(path.join(paths.output, name));
  }
}
