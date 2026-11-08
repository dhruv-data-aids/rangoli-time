import { describe, expect, it } from 'vitest';
import { A, TAU, P, arch, circ, circAt, diamond, dot, leaf, petal, poly, rd, ring, tri, withOrigin, xf, tp } from '../src/geometry/primitives';

/** Pull every x,y pair out of a path that uses only absolute commands. */
function points(d: string): [number, number][] {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
  return out;
}

describe('P', () => {
  it('angle 0 points up, clockwise from there', () => {
    const [x, y] = P(10, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(-10);
    const [x2, y2] = P(10, Math.PI / 2);
    expect(x2).toBeCloseTo(10);
    expect(y2).toBeCloseTo(0);
  });
  it('withOrigin shifts and restores', () => {
    withOrigin(5, 7, () => expect(P(0, 0)).toEqual([5, 7]));
    expect(P(0, 0)).toEqual([0, 0]);
  });
});

describe('A', () => {
  it('makes n copies evenly spaced from the offset', () => {
    const angles = A(4, 0.5, (a) => a);
    expect(angles).toHaveLength(4);
    expect(angles[1] - angles[0]).toBeCloseTo(TAU / 4);
    expect(angles[0]).toBe(0.5);
  });
});

describe('closed, bounded paths', () => {
  const cases = {
    petal: petal(18, 88, 0.3, 0.36),
    leaf: leaf(16, 68, 1, 0.5),
    tri: tri(46, 95, 2, 0.11),
    diamond: diamond(20, 60, 3, 0.2),
    arch: arch(62, 74, 4, 0.12),
  };
  for (const [name, s] of Object.entries(cases)) {
    it(`${name} is closed and stays near its ring`, () => {
      expect(s.d.startsWith('M')).toBe(true);
      expect(s.d.endsWith('Z')).toBe(true);
      expect(s.type).toBe(name);
      for (const [x, y] of points(s.d)) expect(Math.hypot(x, y)).toBeLessThan(120);
    });
  }
  it('petal tip sits at r2 and base at r1', () => {
    const s = petal(18, 88, 0, 0.36);
    const pts = points(s.d);
    expect(pts[0]).toEqual([0, -18]);
    expect(Math.max(...pts.map(([, y]) => -y))).toBeGreaterThanOrEqual(88);
  });
  it('labels spans independent of argument order (flames reverse r1/r2)', () => {
    expect(petal(88, 18, 0, 0.3).r).toBe(petal(18, 88, 0, 0.3).r);
  });
});

describe('dots and discs', () => {
  it('dot records ring radius, not its own size', () => {
    const a = dot(93, 0, 3.6);
    const b = dot(93, 1, 3.6);
    expect(a.r).toBe('93');
    expect(b.r).toBe(a.r);
    expect(a.type).toBe('dot');
  });
  it('mirrored off-centre circles share a ring', () => {
    expect(circAt(4, 35, -15).r).toBe(circAt(4, -35, -15).r);
  });
  it('a centred circle is a disc', () => {
    expect(circ(20).type).toBe('disc');
    expect(circ(4, 10, 0).type).toBe('dot');
  });
  it('ring has two sub-paths (outer + hole)', () => {
    expect((ring(40, 48).d.match(/M/g) ?? []).length).toBe(2);
  });
});

describe('poly', () => {
  it('labels by min-max vertex distance and is rotation invariant', () => {
    const k = (a: number) => poly([P(36, a - 0.2), P(94, a), P(36, a + 0.2), P(26, a)]);
    expect(k(0).r).toBe('26-94');
    for (let i = 0; i < 8; i++) expect(k((i * TAU) / 8).r).toBe('26-94');
  });
});

describe('transforms', () => {
  it('rd rounds to 2dp', () => expect(rd(1.23456)).toBe(1.23));
  it('xf rotates and translates', () => {
    const [x, y] = xf(10, 20, Math.PI / 2)(1, 0);
    expect(x).toBeCloseTo(10);
    expect(y).toBeCloseTo(21);
  });
  it('tp maps number pairs and keeps command letters', () => {
    expect(tp(['M', 1, 2, 'L', 3, 4, 'Z'], (x, y) => [x + 1, y + 1])).toBe('M2 3 L4 5 Z');
  });
});
