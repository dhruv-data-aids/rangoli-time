import type { Shape } from './geometry/primitives';

/**
 * A named set of shapes. `set: true` marks layers whose pieces are NOT arranged
 * on concentric circles (e.g. the kolam grid): the whole layer is one group.
 */
export interface Layer {
  name: string;
  shapes: Shape[];
  set?: boolean;
  /** Make mode: which ring (0 = centre) and role ('a' main, 'b' accent) */
  ring?: number;
  role?: string;
}

export interface FlatShape {
  d: string;
  /** unique key for this piece: `<layer>-<index>` */
  k: string;
  /** groupId = shapeType + ringRadius (e.g. "petal@18-88", "dot@93") */
  g: string;
  type: string;
  layer: string;
  ring?: number;
  role?: string;
}

export const L = (name: string, shapes: Shape | Shape[], opts: { set?: boolean } = {}): Layer => ({
  name,
  shapes: Array.isArray(shapes) ? shapes : [shapes],
  set: opts.set,
});

const baseGroup = (layer: Layer, s: Shape): string =>
  layer.set ? `${layer.shapes[0].type}@set` : `${s.type}@${s.r}`;

/**
 * Turn layers into individually addressable pieces, each carrying a groupId.
 *
 * groupId = shapeType + ringRadius. If two *different* layers end up with the
 * same id (e.g. the two alternating leaf rings of the wreath, or the big and
 * small dots of a Make-mode ring) the layer name is appended so they stay apart.
 */
export function flatten(layers: Layer[]): FlatShape[] {
  const owners = new Map<string, Set<string>>();
  for (const l of layers)
    for (const s of l.shapes) {
      const g = baseGroup(l, s);
      if (!owners.has(g)) owners.set(g, new Set());
      owners.get(g)!.add(l.name);
    }
  const out: FlatShape[] = [];
  for (const l of layers)
    l.shapes.forEach((s, j) => {
      let g = baseGroup(l, s);
      if (owners.get(g)!.size > 1) g += '#' + l.name;
      out.push({ d: s.d, k: `${l.name}-${j}`, g, type: s.type, layer: l.name, ring: l.ring, role: l.role });
    });
  return out;
}

/** Distinct groups of a flattened design with their sizes (used by the audit + tests). */
export function groupSummary(shapes: FlatShape[]): { g: string; count: number }[] {
  const m = new Map<string, number>();
  for (const s of shapes) m.set(s.g, (m.get(s.g) ?? 0) + 1);
  return [...m].map(([g, count]) => ({ g, count }));
}
