/**
 * Path generators for rangoli pieces. Everything is drawn in a 200×200 box
 * centred on (0,0); angle 0 points straight up and increases clockwise.
 *
 * Every generator returns a Shape: the SVG path plus the two facts the grouping
 * rules need — what kind of piece it is (`type`) and which circle / ring it sits
 * on (`r`, a label such as "18-88" for a span or "93" for a dot ring).
 */
export const TAU = Math.PI * 2;

export interface Shape {
  d: string;
  /** shape type: petal, leaf, tri, dot, disc, band, ... */
  type: string;
  /** ring label: "r1-r2" for spans, or a single radius for dots / mirrored pieces */
  r: string;
  /** numeric reference radius (distance of the piece from the centre) */
  rn: number;
}

let OX = 0;
let OY = 0;

export const rd = (v: number): number => Math.round(v * 100) / 100;
/** Round to a stable integer label (rounds to 2dp first so float noise can't flip a .5). */
const lab = (v: number): number => Math.round(rd(v));
const span = (a: number, b: number): string => `${lab(Math.min(a, b))}-${lab(Math.max(a, b))}`;

export type Pt = [number, number];
/** Point at radius r and angle a (0 = up, clockwise), relative to the current origin. */
export const P = (r: number, a: number): Pt => [OX + r * Math.sin(a), OY - r * Math.cos(a)];
const pt = (p: Pt): string => rd(p[0]) + ' ' + rd(p[1]);

/** Run `f` with the drawing origin moved to (x, y) (used by off-centre motifs). */
export function withOrigin<T>(x: number, y: number, f: () => T): T {
  OX = x;
  OY = y;
  try {
    return f();
  } finally {
    OX = 0;
    OY = 0;
  }
}

export const mk = (type: string, r: string, d: string, rn = 0): Shape => ({ d, type, r, rn });
/** A hand-authored path that is not produced by one of the generators. */
export const raw = (type: string, d: string, r = '0', rn = 0): Shape => mk(type, r, d, rn);

export const circD = (r: number, cx = 0, cy = 0): string =>
  `M${rd(cx - r)} ${rd(cy)}a${rd(r)} ${rd(r)} 0 1 0 ${rd(2 * r)} 0a${rd(r)} ${rd(r)} 0 1 0 ${rd(-2 * r)} 0Z`;

/** A circle. At the centre it is a "disc"; anywhere else it is a "dot" on the circle through its centre. */
export function circ(r: number, cx = 0, cy = 0): Shape {
  if (!cx && !cy) return mk('disc', String(lab(r)), circD(r), 0);
  return circAt(r, cx, cy);
}
/** A dot at an explicit position, always typed "dot" (ring = its distance from the origin). */
export function circAt(r: number, cx: number, cy: number): Shape {
  const h = Math.hypot(cx, cy);
  return mk('dot', String(lab(h)), circD(r, cx, cy), h);
}
/** An annulus between radii a and b (even-odd fill leaves the hole). */
export const ring = (a: number, b: number): Shape => mk('band', span(a, b), circD(b) + circD(a), (a + b) / 2);

export function poly(ps: Pt[], type = 'poly'): Shape {
  const ds = ps.map((p) => Math.hypot(p[0], p[1]));
  const mn = Math.min(...ds);
  const mx = Math.max(...ds);
  return mk(type, span(mn, mx), 'M' + ps.map(pt).join('L') + 'Z', (mn + mx) / 2);
}

/** A dot of radius `rad` sitting on the circle of radius `r` at angle `a`. */
export function dot(r: number, a: number, rad: number): Shape {
  const p = P(r, a);
  return mk('dot', String(lab(r)), circD(rad, p[0], p[1]), r);
}

export function petal(r1: number, r2: number, a: number, w: number): Shape {
  const h = r2 - r1;
  const b = P(r1, a);
  const t = P(r2, a);
  const d = `M${pt(b)}C${pt(P(r1 + h * 0.45, a - w))} ${pt(P(r2 + h * 0.12, a - w * 0.75))} ${pt(t)}C${pt(P(r2 + h * 0.12, a + w * 0.75))} ${pt(P(r1 + h * 0.45, a + w))} ${pt(b)}Z`;
  return mk('petal', span(r1, r2), d, (r1 + r2) / 2);
}

export function leaf(r1: number, r2: number, a: number, w: number): Shape {
  const m = (r1 + r2) / 2;
  const d = `M${pt(P(r1, a))}Q${pt(P(m, a - w))} ${pt(P(r2, a))}Q${pt(P(m, a + w))} ${pt(P(r1, a))}Z`;
  return mk('leaf', span(r1, r2), d, m);
}

export const tri = (r1: number, r2: number, a: number, w: number): Shape =>
  poly([P(r1, a - w), P(r2, a), P(r1, a + w)], 'tri');

export function diamond(r1: number, r2: number, a: number, w: number): Shape {
  const m = (r1 + r2) / 2;
  return poly([P(r1, a), P(m, a - w), P(r2, a), P(m, a + w)], 'diamond');
}

export function arch(r1: number, r2: number, a: number, w: number): Shape {
  const k = r2 + (r2 - r1) * 0.3;
  const d = `M${pt(P(r1, a - w))}C${pt(P(k, a - w))} ${pt(P(k, a + w))} ${pt(P(r1, a + w))}Z`;
  return mk('arch', span(r1, r2), d, (r1 + r2) / 2);
}

/** n evenly spaced copies around the centre, starting at angle `off`. */
export const A = <T>(n: number, off: number, f: (a: number, i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(off + (i * TAU) / n, i));

export const ev = (_: unknown, i: number): boolean => i % 2 === 0;
export const od = (_: unknown, i: number): boolean => i % 2 === 1;

/** Transform pairs of numbers inside a path command list (letters pass through). */
export function tp(cmds: (string | number)[], f: (x: number, y: number) => Pt): string {
  let s = '';
  let b: number[] = [];
  for (const c of cmds) {
    if (typeof c === 'string') s += c;
    else {
      b.push(c);
      if (b.length === 2) {
        const p = f(b[0], b[1]);
        s += rd(p[0]) + ' ' + rd(p[1]) + ' ';
        b = [];
      }
    }
  }
  return s;
}

/** Rotate by `ang`, scale by `s`, then translate to (cx, cy). */
export const xf =
  (cx: number, cy: number, ang: number, s = 1) =>
  (x: number, y: number): Pt => {
    x *= s;
    y *= s;
    const c = Math.cos(ang);
    const n = Math.sin(ang);
    return [cx + x * c - y * n, cy + x * n + y * c];
  };
