import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { overrideCredit, overrideImageRef, processImage, pruneOutput, type ImagePaths } from '../src/lib/images.ts';

const tmp = await mkdtemp(path.join(os.tmpdir(), 'aou-images-'));
const paths: ImagePaths = {
  root: tmp,
  originals: path.join(tmp, 'originals'),
  output: path.join(tmp, 'media'),
  publicPrefix: '/media/',
  sampleDir: path.resolve('data/sample'),
  overrideDir: path.resolve('data/sample/bilder'),
};

afterAll(() => rm(tmp, { recursive: true, force: true }));

describe('processImage', () => {
  it('creates AVIF and WebP in several widths for photos', async () => {
    const { image, files } = await processImage({ kind: 'sample', path: 'bilder/theater-buehne.jpg' }, paths);
    expect(image.kind).toBe('photo');
    expect([image.width, image.height]).toEqual([1600, 1000]);
    expect(image.src).toMatch(/^\/media\/[0-9a-f]{12}-800\.webp$/);
    expect(image.sources.map((s) => s.type)).toEqual(['image/avif', 'image/webp']);
    expect(image.sources[0]!.srcset).toMatch(/480w, .*800w, .*1200w$/);
    expect(files).toHaveLength(6);
  });

  it('detects logos by transparency and never upscales', async () => {
    const { image } = await processImage({ kind: 'sample', path: 'bilder/lernwerkstatt-logo.png' }, paths);
    expect(image.kind).toBe('logo');
    expect(image.sources[1]!.srcset).toMatch(/480w, .*640w$/);
  });

  it('rejects paths outside the sample folder', async () => {
    await expect(processImage({ kind: 'sample', path: '../../package.json' }, paths)).rejects.toThrow(/Ungültiger Pfad/);
  });

  it('prunes files no entry uses any more', async () => {
    const { files } = await processImage({ kind: 'sample', path: 'bilder/sportplatz.jpg' }, paths);
    await pruneOutput(paths, new Set(files));
    expect((await readdir(paths.output)).sort()).toEqual([...files].sort());
  });
});

describe('overrideImageRef', () => {
  it('finds a replacement image by project id', () => {
    expect(overrideImageRef('theater-buehne', paths)).toEqual({ kind: 'local', path: 'theater-buehne.jpg' });
    expect(overrideImageRef('gibt-es-nicht', paths)).toBeNull();
  });
});

describe('overrideCredit', () => {
  it('reads the credit for a replacement image from nachweise.csv', () => {
    expect(overrideCredit('theater-buehne', paths)).toBe('Beispiel Fotografin');
    expect(overrideCredit('gibt-es-nicht', paths)).toBeNull();
  });
});
