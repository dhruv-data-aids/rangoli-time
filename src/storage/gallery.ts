import { clear, del, get, keys, set, getMany } from 'idb-keyval';
import { kv } from './db';
import { cleanFills, cleanRecipe, cleanRings, cleanStickers, isDesignId } from '../state/store';
import type { RingCfg } from '../designs/make-pieces';
import type { Sticker } from '../stickers';

export interface ColoredSnapshot {
  designId: string;
  surprise: string[] | null;
  fills: Record<string, string>;
  stk: Sticker[];
}
export interface MadeSnapshot {
  rings: (RingCfg | null)[];
  stk: Sticker[];
}
export interface MadeRecipe {
  center: string | null;
  inner: string | null;
  outer: string | null;
  border: string | null;
}

interface Base {
  /** unique id */
  id: string;
  /** epoch ms */
  createdAt: number;
  /** standalone, self-contained SVG markup of the picture */
  svg: string;
}
export interface ColoredItem extends Base {
  mode: 'colored';
  designName: string;
  state: ColoredSnapshot;
}
export interface MadeItem extends Base {
  mode: 'made';
  recipe: MadeRecipe;
  state: MadeSnapshot;
}
export type GalleryItem = ColoredItem | MadeItem;

const PREFIX = 'g:';
const MAX_SVG = 3_000_000;

export const newId = (): string =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

export const recipeOf = (rings: (RingCfg | null)[]): MadeRecipe => ({
  center: rings[0]?.m ?? null,
  inner: rings[1]?.m ?? null,
  outer: rings[2]?.m ?? null,
  border: rings[3]?.m ?? null,
});

/** Validate + normalise one item (from storage or an imported file). Returns null if it isn't usable. */
export function parseItem(x: unknown): GalleryItem | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id || o.id.length > 80) return null;
  if (typeof o.createdAt !== 'number' || !Number.isFinite(o.createdAt)) return null;
  if (typeof o.svg !== 'string' || !o.svg.startsWith('<svg') || o.svg.length > MAX_SVG) return null;
  const st = o.state as Record<string, unknown> | undefined;
  if (!st || typeof st !== 'object') return null;
  const base = { id: o.id, createdAt: o.createdAt, svg: o.svg };
  if (o.mode === 'colored') {
    if (!isDesignId(st.designId)) return null;
    const surprise = cleanRecipe(st.surprise);
    if (st.designId === 'surprise' && !surprise) return null;
    const name = typeof o.designName === 'string' ? o.designName.slice(0, 60) : 'Rangoli';
    return { ...base, mode: 'colored', designName: name, state: { designId: st.designId, surprise, fills: cleanFills(st.fills), stk: cleanStickers(st.stk) } };
  }
  if (o.mode === 'made') {
    const rings = cleanRings(st.rings);
    return { ...base, mode: 'made', recipe: recipeOf(rings), state: { rings, stk: cleanStickers(st.stk) } };
  }
  return null;
}

export async function saveItem(item: GalleryItem): Promise<void> {
  await set(PREFIX + item.id, item, kv());
}
export async function getItem(id: string): Promise<GalleryItem | null> {
  return parseItem(await get(PREFIX + id, kv()));
}
export async function deleteItem(id: string): Promise<void> {
  await del(PREFIX + id, kv());
}
/** All saved items, newest first. */
export async function listItems(): Promise<GalleryItem[]> {
  const ks = (await keys(kv())).filter((k): k is string => typeof k === 'string' && k.startsWith(PREFIX));
  const raw = await getMany(ks, kv());
  return raw.map(parseItem).filter((x): x is GalleryItem => !!x).sort((a, b) => b.createdAt - a.createdAt);
}
export async function clearGallery(): Promise<void> {
  const ks = (await keys(kv())).filter((k) => typeof k === 'string' && k.startsWith(PREFIX));
  await Promise.all(ks.map((k) => del(k, kv())));
}
/** Test helper: wipe the whole database. */
export const _wipeAll = (): Promise<void> => clear(kv());

/* ---------- backup ---------- */
export interface ExportFile {
  app: 'rangoli-time';
  version: 1;
  exportedAt: string;
  items: GalleryItem[];
}
export async function exportGallery(): Promise<string> {
  const file: ExportFile = { app: 'rangoli-time', version: 1, exportedAt: new Date().toISOString(), items: await listItems() };
  return JSON.stringify(file);
}
export interface ImportResult {
  added: number;
  /** already in the gallery (same id) */
  skipped: number;
  /** could not be read */
  invalid: number;
}
export async function importGallery(json: string): Promise<ImportResult> {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('That file is not a Rangoli Time backup.');
  }
  const f = data as Partial<ExportFile> | null;
  if (!f || f.app !== 'rangoli-time' || !Array.isArray(f.items)) throw new Error('That file is not a Rangoli Time backup.');
  const have = new Set((await listItems()).map((i) => i.id));
  const res: ImportResult = { added: 0, skipped: 0, invalid: 0 };
  for (const raw of f.items) {
    const item = parseItem(raw);
    if (!item) res.invalid++;
    else if (have.has(item.id)) res.skipped++;
    else {
      await saveItem(item);
      have.add(item.id);
      res.added++;
    }
  }
  return res;
}
