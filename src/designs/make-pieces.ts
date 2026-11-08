import { A, TAU, P, arch, circ, diamond, dot, leaf, petal, poly, ring, tri } from '../geometry/primitives';
import { L, type Layer } from '../grouping';

/** Make mode: four rings from the middle outwards. Radii are [inner, outer]. */
export const RINGS: [number, number][] = [[0, 22], [24, 48], [50, 72], [74, 96]];
export const STEP_NAMES = ['Center', 'Inner', 'Outer', 'Border'];

export interface RingCfg {
  m: string;
  /** main colour (role 'a') */
  c: string;
  /** accent colour (role 'b') */
  c2: string;
  /** per-piece overrides from "One piece" taps, by piece key */
  o: Record<string, string>;
}

type CenterFn = () => Layer[];
type RingFn = (r1: number, r2: number, offset: boolean) => Layer[];

export const CENTER_M: Record<string, CenterFn> = {
  bloom: () => [L('a', A(6, 0, (a) => petal(4, 22, a, 0.55))), L('b', circ(7))],
  star: () => [L('a', A(8, 0, (a) => poly([P(10, a - TAU / 16), P(22, a), P(10, a + TAU / 16), P(6, a)], 'kite'))), L('b', circ(9))],
  lotus: () => [L('a', A(8, 0, (a) => leaf(3, 22, a, 0.47))), L('b', circ(6))],
  sun: () => [L('a', A(12, 0, (a) => tri(12, 22, a, 0.26))), L('b', circ(13))],
  bindu: () => [L('a', circ(21)), L('b', circ(10))],
};

/** How many pieces fit around a ring: a multiple of 4, at least 8. */
export function cnt(r1: number, r2: number, k: number): number {
  const h = r2 - r1;
  const m = (r1 + r2) / 2;
  return Math.max(8, 4 * Math.round((TAU * m) / (h * k) / 4));
}

export const RING_M: Record<string, RingFn> = {
  petals: (r1, r2, o) => {
    const n = cnt(r1, r2, 0.9), off = o ? TAU / n / 2 : 0, h = r2 - r1;
    return [L('a', A(n, off, (a) => petal(r1, r2, a, (0.55 * TAU) / n))), L('b', A(n, off, (a) => petal(r1 + h * 0.28, r2 - h * 0.2, a, (0.25 * TAU) / n)))];
  },
  leaves: (r1, r2, o) => {
    const n = cnt(r1, r2, 0.8), off = o ? TAU / n / 2 : 0, h = r2 - r1;
    return [L('a', A(n, off, (a) => leaf(r1, r2, a, (0.6 * TAU) / n))), L('b', A(n, off, (a) => dot(r1 + h * 0.7, a + TAU / n / 2, h * 0.11)))];
  },
  rays: (r1, r2, o) => {
    const n = cnt(r1, r2, 0.8), off = o ? TAU / n / 2 : 0, h = r2 - r1;
    return [L('a', A(n, off, (a) => tri(r1, r2, a, (0.48 * TAU) / n))), L('b', A(n, off, (a) => tri(r1, r1 + h * 0.55, a + TAU / n / 2, (0.3 * TAU) / n)))];
  },
  dots: (r1, r2, o) => {
    const n = cnt(r1, r2, 1.1), off = o ? TAU / n / 2 : 0, h = r2 - r1, m = (r1 + r2) / 2;
    return [L('a', A(n, off, (a) => dot(m, a, h * 0.32))), L('b', A(n, off, (a) => dot(m, a + TAU / n / 2, h * 0.13)))];
  },
  arches: (r1, r2, o) => {
    const n = cnt(r1, r2, 0.9), off = o ? TAU / n / 2 : 0, h = r2 - r1;
    return [L('a', A(n, off, (a) => arch(r1, r2, a, (0.48 * TAU) / n))), L('b', A(n, off, (a) => dot(r1 + h * 0.38, a, h * 0.14)))];
  },
  diamonds: (r1, r2, o) => {
    const n = cnt(r1, r2, 0.8), off = o ? TAU / n / 2 : 0, h = r2 - r1;
    return [L('a', A(n, off, (a) => diamond(r1, r2, a, (0.45 * TAU) / n))), L('b', A(n, off, (a) => diamond(r1 + h * 0.28, r2 - h * 0.28, a, (0.18 * TAU) / n)))];
  },
  flames: (r1, r2, o) => {
    const n = cnt(r1, r2, 0.8), off = o ? TAU / n / 2 : 0, h = r2 - r1;
    return [L('a', A(n, off, (a) => petal(r2, r1, a, (0.55 * TAU) / n))), L('b', A(n, off, (a) => dot(r1 + h * 0.28, a, h * 0.12)))];
  },
  band: (r1, r2, o) => {
    const h = r2 - r1, m = (r1 + r2) / 2, n = cnt(r1, r2, 1.3), off = o ? TAU / n / 2 : 0;
    return [L('a', ring(r1 + h * 0.12, r2 - h * 0.12)), L('b', A(n, off, (a) => dot(m, a, h * 0.2)))];
  },
};

export const CENTER_KEYS = Object.keys(CENTER_M);
export const RING_KEYS = Object.keys(RING_M);

export const isValidMotif = (ringIndex: number, m: string): boolean => (ringIndex === 0 ? m in CENTER_M : m in RING_M);

/** Layers for a set of rings; layers are named `r<ring><role>` and carry ring + role. */
export function buildLayers(rings: ({ m: string } | null)[]): Layer[] {
  const out: Layer[] = [];
  rings.forEach((rg, i) => {
    if (!rg) return;
    const [r1, r2] = RINGS[i];
    const fn = i === 0 ? CENTER_M[rg.m] : RING_M[rg.m];
    if (!fn) return;
    const ls = i === 0 ? (fn as CenterFn)() : (fn as RingFn)(r1, r2, i % 2 === 1);
    ls.forEach((l) => out.push({ ...l, name: 'r' + i + l.name, ring: i, role: l.name }));
  });
  return out;
}
