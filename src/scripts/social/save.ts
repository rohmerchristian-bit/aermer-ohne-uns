// Saving finished images: straight into a folder (Chrome/Edge – e.g. the Google Drive folder
// synced with "Google Drive für Desktop"), one subfolder per project; otherwise as download / ZIP.

import { zipSync } from 'fflate';

// Minimal types for the File System Access API (not in every TypeScript DOM lib yet).
interface WritableFile {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}
interface FileHandle {
  createWritable(): Promise<WritableFile>;
}
export interface FolderHandle {
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FolderHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle>;
  queryPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
}
type PickerWindow = Window & { showDirectoryPicker?: (options?: { mode?: 'readwrite'; id?: string }) => Promise<FolderHandle> };

export const canPickFolder = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

// ---- remember the chosen folder across visits (IndexedDB can store the handle) ----

const DB = 'aou-social';
const STORE = 'settings';

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  try {
    const database = await db();
    return await new Promise<T | undefined>((resolve, reject) => {
      const request = run(database.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return undefined; // private window or blocked storage: the folder is simply not remembered
  }
}

export const loadFolder = () => idb<FolderHandle>('readonly', (s) => s.get('folder'));
const storeFolder = (handle: FolderHandle) => idb('readwrite', (s) => s.put(handle, 'folder'));

export async function pickFolder(): Promise<FolderHandle | null> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) return null;
  try {
    const handle = await picker({ mode: 'readwrite', id: 'aou-social' });
    await storeFolder(handle);
    return handle;
  } catch {
    return null; // cancelled
  }
}

async function writable(folder: FolderHandle): Promise<boolean> {
  if ((await folder.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  return (await folder.requestPermission({ mode: 'readwrite' })) === 'granted';
}

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

/** Saves files into <folder>/<subfolder>/. Returns false if the folder may not be written to. */
export async function saveToFolder(folder: FolderHandle, subfolder: string, files: Output[]): Promise<boolean> {
  if (!(await writable(folder))) return false;
  const target = await folder.getDirectoryHandle(safeName(subfolder), { create: true });
  for (const file of files) {
    const handle = await target.getFileHandle(file.name, { create: true });
    const stream = await handle.createWritable();
    await stream.write(file.blob);
    await stream.close();
  }
  return true;
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
