import { DESIGNS } from '../designs/designs';
import { RINGS, isValidMotif, type RingCfg } from '../designs/make-pieces';
import { STK, type Sticker } from '../stickers';

export type Mode = 'color' | 'build' | 'gallery';

export interface ColorState {
  id: string;
  fills: Record<string, Record<string, string>>;
  stk: Record<string, Sticker[]>;
  /** motif recipe of the current "New" (surprise) design */
  surprise: string[] | null;
}
export interface BuildState {
  rings: (RingCfg | null)[];
  step: number;
  stk: Sticker[];
}
export interface AppState {
  v: 1;
  mode: Mode;
  color: ColorState;
  build: BuildState;
  /** index into PALETTE */
  ci: number;
  /** true = "Whole ring", false = "One piece" */
  whole: boolean;
  sound: boolean;
  /** stickers: ×8 around */
  repeat: boolean;
  sType: string;
}

export function defaultState(): AppState {
  return {
    v: 1,
    mode: 'color',
    color: { id: 'lotus', fills: {}, stk: {}, surprise: null },
    build: {
      rings: [
        { m: 'bloom', c: '#FFD12E', c2: '#E3262F', o: {} },
        { m: 'petals', c: '#FF9B1F', c2: '#EC3392', o: {} },
        null,
        null,
      ],
      step: 2,
      stk: [],
    },
    ci: 10,
    whole: true,
    sound: true,
    repeat: true,
    sType: 'diya',
  };
}

/* ---------- validation: anything read from storage / an imported file goes through here ---------- */
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const isColor = (x: unknown): x is string => typeof x === 'string' && /^#[0-9a-f]{3,8}$/i.test(x);
const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

export function cleanFills(x: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (isObj(x)) for (const [k, v] of Object.entries(x)) if (isColor(v) && k.length < 40) out[k] = v;
  return out;
}
export function cleanStickers(x: unknown): Sticker[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((s): s is Record<string, unknown> => isObj(s) && typeof s.t === 'string' && s.t in STK && num(s.x) && num(s.y))
    .slice(0, 2000)
    .map((s) => ({ t: s.t as string, x: s.x as number, y: s.y as number, rot: num(s.rot) ? (s.rot as number) : 0 }));
}
export function cleanRings(x: unknown): (RingCfg | null)[] {
  const arr = Array.isArray(x) ? x : [];
  return RINGS.map((_, i) => {
    const r = arr[i];
    if (!isObj(r) || typeof r.m !== 'string' || !isValidMotif(i, r.m) || !isColor(r.c) || !isColor(r.c2)) return null;
    return { m: r.m, c: r.c, c2: r.c2, o: cleanFills(r.o) };
  });
}
export function cleanRecipe(x: unknown): string[] | null {
  if (!Array.isArray(x) || x.length !== 4) return null;
  return x.every((m, i) => typeof m === 'string' && isValidMotif(i, m)) ? (x as string[]) : null;
}
export const isDesignId = (id: unknown): id is string => typeof id === 'string' && (id === 'surprise' || DESIGNS.some((d) => d.id === id));

/** Merge a stored state onto the defaults, dropping anything invalid. */
export function sanitizeState(raw: unknown): AppState {
  const s = defaultState();
  if (!isObj(raw)) return s;
  if (isObj(raw.color)) {
    const c = raw.color;
    s.color.surprise = cleanRecipe(c.surprise);
    if (isDesignId(c.id) && (c.id !== 'surprise' || s.color.surprise)) s.color.id = c.id;
    if (isObj(c.fills)) for (const [id, f] of Object.entries(c.fills)) if (isDesignId(id)) s.color.fills[id] = cleanFills(f);
    if (isObj(c.stk)) for (const [id, l] of Object.entries(c.stk)) if (isDesignId(id)) s.color.stk[id] = cleanStickers(l);
  }
  if (isObj(raw.build) && Array.isArray(raw.build.rings)) {
    s.build.rings = cleanRings(raw.build.rings);
    s.build.step = num(raw.build.step) ? Math.max(0, Math.min(3, Math.round(raw.build.step))) : 2;
    s.build.stk = cleanStickers(raw.build.stk);
  }
  if (raw.mode === 'build') s.mode = 'build'; // never reopen on the gallery
  if (num(raw.ci) && raw.ci >= 0 && raw.ci < 14) s.ci = Math.round(raw.ci);
  if (typeof raw.whole === 'boolean') s.whole = raw.whole;
  if (typeof raw.sound === 'boolean') s.sound = raw.sound;
  if (typeof raw.repeat === 'boolean') s.repeat = raw.repeat;
  if (typeof raw.sType === 'string' && raw.sType in STK) s.sType = raw.sType;
  return s;
}

/* ---------- the live state ---------- */
export const st: AppState = defaultState();
export function replaceState(next: AppState): void {
  Object.assign(st, next);
}

type Saver = (s: AppState) => void | Promise<void>;
let saver: Saver | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
export function setSaver(fn: Saver): void {
  saver = fn;
}
/** Debounced autosave of the work in progress. */
export function save(): void {
  clearTimeout(timer);
  timer = setTimeout(flushSave, 250);
}
export function flushSave(): void {
  clearTimeout(timer);
  if (saver) void saver(st);
}

/* ---------- undo (separate stacks for each mode) ---------- */
type Snap = string;
const stacks: Record<'color' | 'build', Snap[]> = { color: [], build: [] };

function snap(mode: 'color' | 'build'): Snap {
  if (mode === 'build') return JSON.stringify(st.build);
  const id = st.color.id;
  return JSON.stringify({ id, f: st.color.fills[id] || {}, s: st.color.stk[id] || [], sp: id === 'surprise' ? st.color.surprise : null });
}
export function pushUndo(mode: 'color' | 'build' = st.mode === 'build' ? 'build' : 'color'): void {
  const u = stacks[mode];
  u.push(snap(mode));
  if (u.length > 80) u.shift();
}
export const canUndo = (): boolean => st.mode !== 'gallery' && stacks[st.mode].length > 0;
export function popUndo(): boolean {
  if (st.mode === 'gallery') return false;
  const u = stacks[st.mode];
  if (!u.length) return false;
  const s = JSON.parse(u.pop()!);
  if (st.mode === 'build') st.build = { rings: cleanRings(s.rings), step: s.step, stk: cleanStickers(s.stk) };
  else {
    st.color.id = s.id;
    st.color.fills[s.id] = cleanFills(s.f);
    st.color.stk[s.id] = cleanStickers(s.s);
    if (s.sp) st.color.surprise = cleanRecipe(s.sp);
  }
  return true;
}
export const clearUndo = (): void => {
  stacks.color.length = 0;
  stacks.build.length = 0;
};
