import { DESIGNS } from './designs/designs';
import { buildLayers, type RingCfg } from './designs/make-pieces';
import { randomCfg } from './designs/surprise';
import { flatten, type FlatShape } from './grouping';
import { st } from './state/store';
import type { Sticker } from './stickers';

const cache = new Map<string, FlatShape[]>();

export function designShapes(id: string): FlatShape[] {
  if (id === 'surprise') {
    if (!st.color.surprise) st.color.surprise = randomCfg();
    const key = 's:' + st.color.surprise.join(',');
    if (!cache.has(key)) cache.set(key, flatten(buildLayers(st.color.surprise.map((m) => ({ m })))));
    return cache.get(key)!;
  }
  if (!cache.has(id)) cache.set(id, flatten((DESIGNS.find((d) => d.id === id) ?? DESIGNS[0]).layers()));
  return cache.get(id)!;
}
export const buildShapes = (rings: ({ m: string } | null)[]): FlatShape[] => flatten(buildLayers(rings));
export const currentShapes = (): FlatShape[] => (st.mode === 'build' ? buildShapes(st.build.rings) : designShapes(st.color.id));

export const ringFill = (rg: RingCfg, s: FlatShape): string => rg.o[s.k] || (s.role === 'a' ? rg.c : rg.c2);
export function fillFor(s: FlatShape): string | null {
  if (st.mode === 'build') {
    const rg = s.ring !== undefined ? st.build.rings[s.ring] : null;
    return rg ? ringFill(rg, s) : null;
  }
  return st.color.fills[st.color.id]?.[s.k] ?? null;
}
export function curStickers(): Sticker[] {
  if (st.mode === 'build') return st.build.stk;
  return (st.color.stk[st.color.id] ??= []);
}
export const designName = (id: string): string =>
  id === 'surprise' ? 'Surprise design' : (DESIGNS.find((d) => d.id === id)?.name ?? 'Rangoli');
