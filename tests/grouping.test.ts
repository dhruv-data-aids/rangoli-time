import { describe, expect, it } from 'vitest';
import { DESIGNS } from '../src/designs/designs';
import { CENTER_KEYS, RING_KEYS, buildLayers } from '../src/designs/make-pieces';
import { randomCfg } from '../src/designs/surprise';
import { flatten, groupSummary, L } from '../src/grouping';
import { circAt, dot, leaf } from '../src/geometry/primitives';

const flat = (id: string) => flatten(DESIGNS.find((d) => d.id === id)!.layers());

describe('flatten / groupId', () => {
  it('groupId is shapeType@ringRadius', () => {
    const s = flatten([L('d', [dot(93, 0, 3), dot(93, 1, 3)]), L('l', [leaf(16, 68, 0, 0.5)])]);
    expect(s.map((x) => x.g)).toEqual(['dot@93', 'dot@93', 'leaf@16-68']);
  });
  it('keys are unique within a design', () => {
    for (const d of DESIGNS) {
      const keys = flatten(d.layers()).map((s) => s.k);
      expect(new Set(keys).size, d.id).toBe(keys.length);
    }
  });
  it('different layers that collide get separated', () => {
    const s = flatten([L('x', [dot(40, 0, 3)]), L('y', [dot(40, 1, 1)])]);
    expect(new Set(s.map((q) => q.g)).size).toBe(2);
  });
});

describe('no group mixes pieces from different circles', () => {
  it('every dot in a group lies within 1.5 of the group radius (checked on geometry)', () => {
    for (const d of DESIGNS) {
      const layers = d.layers();
      for (const l of layers) {
        if (l.set) continue;
        for (const s of l.shapes) if (s.type === 'dot') expect(Math.abs(s.rn - Number(s.r)), `${d.id}/${l.name}`).toBeLessThanOrEqual(1.5);
      }
    }
  });
  it('shapes of one group share type and ring label', () => {
    for (const d of DESIGNS) {
      const byG = new Map<string, Set<string>>();
      for (const l of d.layers()) {
        if (l.set) continue;
        const fl = flatten([l]);
        l.shapes.forEach((s, j) => {
          const g = fl[j].g;
          if (!byG.has(g)) byG.set(g, new Set());
          byG.get(g)!.add(s.type + '@' + s.r);
        });
      }
      for (const [g, set] of byG) expect(set.size, `${d.id} ${g}`).toBe(1);
    }
  });
});

describe('audited designs', () => {
  it('peacock feather eye-dots split onto their three circles', () => {
    const dots = flat('feather').filter((s) => s.layer === 'fd');
    const counts = Object.fromEntries(groupSummary(dots).map((g) => [g.g, g.count]));
    expect(counts).toEqual({ 'dot@38': 2, 'dot@44': 2, 'dot@50': 1 });
  });
  it('diya bowl dots are one circle; rim dots are a different one', () => {
    const f = flat('diya');
    expect(new Set(f.filter((s) => s.layer === 'bd').map((s) => s.g))).toEqual(new Set(['dot@44']));
    expect(new Set(f.filter((s) => s.layer === 'dots').map((s) => s.g))).toEqual(new Set(['dot@79']));
  });
  it('wreath alternating leaves stay in two groups of 8', () => {
    const c = groupSummary(flat('wreath').filter((s) => s.type === 'leaf' && s.layer.startsWith('o')));
    expect(c.map((x) => x.count)).toEqual([8, 8]);
  });
  it('kolam layers are explicit sets (24-25 dots/diamonds in one group each)', () => {
    const f = flat('kolam');
    expect(f.filter((s) => s.layer === 'kd').every((s) => s.g === f.find((x) => x.layer === 'kd')!.g)).toBe(true);
    expect(new Set(f.filter((s) => s.layer === 'kd').map((s) => s.g)).size).toBe(1);
  });
  it('fish pair: each part groups across both fish', () => {
    const f = flat('fish');
    for (const layer of ['ft', 'ff', 'fb', 'fe']) expect(new Set(f.filter((s) => s.layer === layer).map((s) => s.g)).size, layer).toBe(1);
    expect(new Set(f.filter((s) => s.layer === 'fs').map((s) => s.g)).size).toBe(2);
    expect(new Set(f.filter((s) => s.layer === 'bub').map((s) => s.g)).size).toBe(2);
  });
  it('lotus: ring of 8 petals is one group, nested petals are another', () => {
    const f = flat('lotus');
    expect(new Set(f.filter((s) => s.layer === 'p').map((s) => s.g)).size).toBe(1);
    expect(f.find((s) => s.layer === 'p')!.g).not.toBe(f.find((s) => s.layer === 'pi')!.g);
  });
  it('prints the audit table for all designs', () => {
    const lines = DESIGNS.map((d) => `${d.id}: ` + groupSummary(flatten(d.layers())).map((g) => `${g.g}×${g.count}`).join('  '));
    expect(lines).toHaveLength(14);
    if (import.meta.env.AUDIT) console.log('\n' + lines.join('\n'));
  });
});

describe('Make mode: one group per ring + role', () => {
  it('every motif: role a / role b of a ring are each exactly one group', () => {
    for (let ring = 0; ring < 4; ring++) {
      for (const m of ring === 0 ? CENTER_KEYS : RING_KEYS) {
        const rings = [null, null, null, null] as ({ m: string } | null)[];
        rings[ring] = { m };
        const f = flatten(buildLayers(rings));
        for (const role of ['a', 'b']) {
          const gs = new Set(f.filter((s) => s.role === role).map((s) => s.g));
          expect(gs.size, `${ring}/${m}/${role}`).toBe(1);
        }
        expect(new Set(f.map((s) => s.g)).size, `${ring}/${m} total`).toBe(2);
      }
    }
  });
  it('random surprise sets always have 4 valid rings', () => {
    for (let i = 0; i < 50; i++) {
      const c = randomCfg();
      expect(c).toHaveLength(4);
      expect(CENTER_KEYS).toContain(c[0]);
      for (let j = 2; j < 4; j++) expect(c[j]).not.toBe(c[j - 1]);
    }
  });
  it('circAt is exported for off-centre dots', () => expect(circAt(1, 3, 4).r).toBe('5'));
});
