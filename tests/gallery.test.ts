import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { _wipeAll, deleteItem, exportGallery, getItem, importGallery, listItems, newId, parseItem, recipeOf, saveItem, type GalleryItem } from '../src/storage/gallery';
import { loadWip, saveWip } from '../src/storage/db';
import { defaultState } from '../src/state/store';
import type { RingCfg } from '../src/designs/make-pieces';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200"><path d="M0 0"/></svg>';
const colored = (over: Partial<GalleryItem> = {}): GalleryItem =>
  ({ id: newId(), createdAt: Date.now(), mode: 'colored', designName: 'Lotus', svg, state: { designId: 'lotus', surprise: null, fills: { 'p-0': '#E3262F' }, stk: [{ t: 'diya', x: 10, y: 20, rot: 0 }] }, ...over }) as GalleryItem;
const made = (over: Partial<GalleryItem> = {}): GalleryItem => {
  const rings: (RingCfg | null)[] = [{ m: 'bloom', c: '#FFD12E', c2: '#E3262F', o: { 'r0a-1': '#112233' } }, { m: 'petals', c: '#FF9B1F', c2: '#EC3392', o: {} }, null, { m: 'dots', c: '#fff', c2: '#000', o: {} }];
  return { id: newId(), createdAt: Date.now(), mode: 'made', recipe: recipeOf(rings), svg, state: { rings, stk: [] }, ...over } as GalleryItem;
};

beforeEach(async () => {
  await _wipeAll();
});

describe('gallery storage', () => {
  it('saves and loads an item unchanged', async () => {
    const a = colored();
    await saveItem(a);
    expect(await getItem(a.id)).toEqual(a);
  });
  it('lists newest first and survives a "restart" (module state is irrelevant, data is in IndexedDB)', async () => {
    const old = colored({ createdAt: 1000 });
    const mid = made({ createdAt: 2000 });
    const nu = colored({ createdAt: 3000 });
    for (const i of [mid, old, nu]) await saveItem(i);
    expect((await listItems()).map((i) => i.id)).toEqual([nu.id, mid.id, old.id]);
  });
  it('made items keep their ring recipe', async () => {
    const m = made();
    await saveItem(m);
    const got = (await getItem(m.id))!;
    expect(got.mode === 'made' && got.recipe).toEqual({ center: 'bloom', inner: 'petals', outer: null, border: 'dots' });
  });
  it('deletes', async () => {
    const a = colored();
    const b = made();
    await saveItem(a);
    await saveItem(b);
    await deleteItem(a.id);
    expect((await listItems()).map((i) => i.id)).toEqual([b.id]);
    expect(await getItem(a.id)).toBeNull();
  });
});

describe('export / import', () => {
  it('round-trips the whole gallery', async () => {
    const items = [colored({ createdAt: 1 }), made({ createdAt: 2 }), colored({ createdAt: 3 })];
    for (const i of items) await saveItem(i);
    const json = await exportGallery();
    await _wipeAll();
    expect(await listItems()).toHaveLength(0);
    const res = await importGallery(json);
    expect(res).toEqual({ added: 3, skipped: 0, invalid: 0 });
    expect(await listItems()).toEqual([...items].reverse());
  });
  it('importing twice does not duplicate', async () => {
    await saveItem(colored());
    const json = await exportGallery();
    expect(await importGallery(json)).toEqual({ added: 0, skipped: 1, invalid: 0 });
    expect(await listItems()).toHaveLength(1);
  });
  it('merges into an existing gallery', async () => {
    await saveItem(colored());
    const json = await exportGallery();
    await saveItem(made());
    const res = await importGallery(json);
    expect(res.skipped).toBe(1);
    expect(await listItems()).toHaveLength(2);
  });
  it('rejects non-backup files and skips broken items', async () => {
    await expect(importGallery('not json')).rejects.toThrow();
    await expect(importGallery('{"app":"other","items":[]}')).rejects.toThrow();
    const good = colored();
    const res = await importGallery(JSON.stringify({ app: 'rangoli-time', version: 1, items: [good, { id: 'x' }, null, { ...good, id: 'y', svg: '<script>' }] }));
    expect(res).toEqual({ added: 1, skipped: 0, invalid: 3 });
  });
});

describe('parseItem hardening', () => {
  it('drops bad colours and unknown stickers from imported state', () => {
    const a = colored();
    const dirty = JSON.parse(JSON.stringify(a));
    dirty.state.fills = { 'p-0': 'red;background:url(x)', 'p-1': '#abc' };
    dirty.state.stk = [{ t: 'nope', x: 1, y: 1 }, { t: 'leaf', x: 'a', y: 1 }, { t: 'leaf', x: 1, y: 2 }];
    const got = parseItem(dirty)!;
    expect(got.mode === 'colored' && got.state.fills).toEqual({ 'p-1': '#abc' });
    expect(got.state.stk).toHaveLength(1);
  });
  it('rejects unknown designs', () => {
    const a = JSON.parse(JSON.stringify(colored()));
    a.state.designId = 'nope';
    expect(parseItem(a)).toBeNull();
  });
});

describe('work in progress', () => {
  it('round-trips through IndexedDB', async () => {
    const s = defaultState();
    s.color.fills.lotus = { 'p-0': '#E3262F' };
    s.build.rings[2] = { m: 'dots', c: '#FFD12E', c2: '#E3262F', o: {} };
    await saveWip(s);
    expect(await loadWip()).toEqual(s);
  });
  it('falls back to defaults on garbage', async () => {
    expect(await loadWip()).toEqual(defaultState());
  });
});
