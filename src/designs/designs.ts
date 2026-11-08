import { A, TAU, P, arch, circ, circAt, dot, ev, leaf, od, petal, poly, raw, ring, tp, tri, withOrigin, xf } from '../geometry/primitives';
import { L, type Layer } from '../grouping';

export interface Design {
  id: string;
  name: string;
  layers: () => Layer[];
}

const PAIS = ['M', 0, -18, 'C', 20, -18, 24, 10, 4, 18, 'C', -12, 25, -32, 30, -46, 26, 'C', -32, 20, -24, 8, -18, -2, 'C', -14, -12, -10, -18, 0, -18, 'Z'];
const FB = ['M', -42, 0, 'C', -18, -26, 26, -26, 42, 0, 'C', 26, 26, -18, 26, -42, 0, 'Z'];
const FT = ['M', -36, 0, 'L', -62, -20, 'L', -55, 0, 'L', -62, 20, 'Z'];
const FF = ['M', -6, -17, 'Q', 6, -36, 16, -16, 'Z'];
const FS = (x: number, h: number) => ['M', x, -h, 'Q', x + 14, 0, x, h, 'Q', x + 4, 0, x, -h, 'Z'];
/** A fish part, placed at height cy and rotated; both fish of the pair share ring "34" so each part groups across the pair. */
const fish = (type: string, cmds: (string | number)[], ang: number, cy: number, tag = '') =>
  raw(type, tp(cmds, xf(0, cy, ang)), String(Math.abs(cy)) + tag, Math.abs(cy));

/**
 * The 14 colouring designs. Group audit notes (groupId = shapeType + ringRadius):
 *  - feather `fd`: the five eye-dots sit on three different circles (38 / 44 / 50),
 *    so they now form three groups (mirrored pairs stay together).
 *  - kolam: a square grid, not circles -> each layer is one explicit "set".
 *  - fish: both fish share each part (tail, fin, body, stripes, eye) by mirrored position.
 *  - wreath: the alternating leaf rings keep separate groups (layer suffix).
 */
export const DESIGNS: Design[] = [
  {
    id: 'lotus',
    name: 'Lotus',
    layers: () => [
      L('d', A(16, TAU / 32, (a) => dot(93, a, 3.6))),
      L('b', A(8, TAU / 16, (a) => leaf(16, 68, a, 0.5))),
      L('p', A(8, 0, (a) => petal(18, 88, a, 0.36))),
      L('pi', A(8, 0, (a) => petal(30, 70, a, 0.2))),
      L('c', circ(20)),
      L('c2', circ(9)),
    ],
  },
  {
    id: 'marigold',
    name: 'Marigold',
    layers: () => [
      L('o', A(24, 0, (a) => petal(58, 93, a, 0.17))),
      L('m', A(16, TAU / 32, (a) => petal(38, 70, a, 0.22))),
      L('i', A(12, 0, (a) => petal(20, 48, a, 0.3))),
      L('c', circ(21)),
      L('cd', A(8, 0, (a) => dot(13, a, 4))),
      L('cc', circ(6)),
    ],
  },
  {
    id: 'star',
    name: 'Heart lotus star',
    layers: () => [
      L('d', A(8, TAU / 16, (a) => dot(72, a, 7))),
      L('k', A(8, 0, (a) => poly([P(36, a - TAU / 16), P(94, a), P(36, a + TAU / 16), P(26, a)], 'kite'))),
      L('ki', A(8, 0, (a) => poly([P(46, a - TAU / 44), P(80, a), P(46, a + TAU / 44), P(40, a)], 'kite'))),
      L('c', circ(30)),
      L('cp', A(8, TAU / 16, (a) => petal(8, 28, a, 0.32))),
      L('cc', circ(8)),
    ],
  },
  {
    id: 'diya',
    name: 'Diya',
    layers: () => [
      L('f', ring(84, 94)),
      L('dots', A(12, TAU / 24, (a) => dot(79, a, 3.4))),
      L('ray', [-75, -55, -35, 35, 55, 75].map((d) => tri(46, 74, (d * TAU) / 360, 0.07))),
      L('stand', poly([[-20, 46], [20, 46], [34, 72], [-34, 72]], 'stand')),
      L('bowl', raw('bowl', 'M-62 8Q0 92 62 8Z')),
      L('band', raw('band-curve', 'M-54 14Q0 40 54 14L46 24Q0 50 -46 24Z')),
      // the three bowl dots all sit on the circle of radius 44
      L('bd', [circAt(3.5, 0, 44), circAt(3, -15, 41), circAt(3, 15, 41)]),
      L('rim', raw('rim', 'M-64 8a64 7 0 1 0 128 0a64 7 0 1 0 -128 0Z')),
      L('fl', raw('flame', 'M0 -72C24 -42 20 -8 0 -1C-20 -8 -24 -42 0 -72Z')),
      L('fl2', raw('flame-core', 'M0 -46C12 -30 11 -12 0 -8C-11 -12 -12 -30 0 -46Z')),
    ],
  },
  {
    id: 'feather',
    name: 'Peacock feather',
    layers: () => [
      L('barb', withOrigin(0, -10, () => [45, 70, 95, 120, 145, -45, -70, -95, -120, -145].map((d) => leaf(40, 92, (d * TAU) / 360, 0.2)))),
      L('stem', poly([[-3, 60], [3, 60], [4.5, 97], [-4.5, 97]], 'stem')),
      L('fe', raw('feather', 'M0 -92C58 -62 58 30 0 72C-58 30 -58 -62 0 -92Z')),
      // eye dots: pairs at 38, 44 and 50 from the centre -> three groups
      L('fd', [circAt(4, 35, -15), circAt(4, -35, -15), circAt(4, 18, 40), circAt(4, -18, 40), circAt(4.5, 0, 50)]),
      L('e1', raw('eye-outer', 'M0 -62C36 -42 36 14 0 26C-36 14 -36 -42 0 -62Z')),
      L('e2', raw('eye-mid', 'M0 -44C24 -30 24 4 0 12C-24 4 -24 -30 0 -44Z')),
      L('e3', circAt(10, 0, -14)),
    ],
  },
  {
    id: 'sun',
    name: 'Surya',
    layers: () => [
      L('r1', A(16, 0, (a) => tri(46, 95, a, 0.11))),
      L('r2', A(16, TAU / 32, (a) => tri(46, 76, a, 0.09))),
      L('b', ring(40, 48)),
      L('c', circ(40)),
      L('p', A(8, 0, (a) => petal(12, 38, a, 0.32))),
      L('cc', circ(12)),
    ],
  },
  {
    id: 'kolam',
    name: 'Kolam tiles',
    layers: () => {
      const a: ReturnType<typeof poly>[] = [];
      const b: ReturnType<typeof poly>[] = [];
      const dd: ReturnType<typeof circAt>[] = [];
      const gp: ReturnType<typeof circAt>[] = [];
      for (let i = -2; i <= 2; i++)
        for (let j = -2; j <= 2; j++) {
          const x = i * 34;
          const y = j * 34;
          const dm = poly([[x, y - 17], [x + 17, y], [x, y + 17], [x - 17, y]], 'diamond');
          ((i + j) & 1 ? b : a).push(dm);
          dd.push(circAt(4.2, x, y));
          if (i < 2 && j < 2) gp.push(circAt(7, x + 17, y + 17));
        }
      return [
        L('fr', raw('frame', 'M-94 -94H94V94H-94ZM-88 -88H88V88H-88Z')),
        L('ka', a, { set: true }),
        L('kb', b, { set: true }),
        L('kd', dd, { set: true }),
        L('kg', gp, { set: true }),
      ];
    },
  },
  {
    id: 'mandala',
    name: 'Mandala rings',
    layers: () => [
      L('t', A(32, 0, (a) => tri(76, 95, a, 0.095))),
      L('a', A(24, TAU / 48, (a) => arch(62, 74, a, 0.12))),
      L('b2', ring(58, 62)),
      L('l', A(16, 0, (a) => leaf(36, 58, a, 0.34))),
      L('b1', ring(30, 36)),
      L('p', A(8, TAU / 16, (a) => petal(10, 30, a, 0.34))),
      L('c', circ(10)),
    ],
  },
  {
    id: 'six',
    name: 'Six petals',
    layers: () => [
      L('d', A(12, 0, (a) => dot(89, a, 4.5))),
      L('s', A(6, TAU / 12, (a) => petal(10, 58, a, 0.42))),
      L('p', A(6, 0, (a) => leaf(8, 82, a, 0.8))),
      L('pi', A(6, 0, (a) => leaf(26, 64, a, 0.4))),
      L('c', circ(14)),
      L('cc', circ(6)),
    ],
  },
  {
    id: 'wreath',
    name: 'Leaf wreath',
    layers: () => {
      const out = A(16, 0, (a) => leaf(56, 93, a, 0.26));
      return [
        L('oa', out.filter(ev)),
        L('ob', out.filter(od)),
        L('b', ring(50, 56)),
        L('in', A(12, TAU / 24, (a) => leaf(22, 50, a, 0.38))),
        L('c', circ(20)),
        L('cp', A(6, 0, (a) => petal(6, 19, a, 0.4))),
        L('cc', circ(6)),
      ];
    },
  },
  {
    id: 'twelve',
    name: 'Twelve-point star',
    layers: () => [
      L('t', A(12, 0, (a) => poly([P(52, a - TAU / 24), P(94, a), P(52, a + TAU / 24)], 'point'))),
      L('d', A(12, TAU / 24, (a) => dot(70, a, 5))),
      L('c1', circ(52)),
      L('t2', A(12, TAU / 24, (a) => poly([P(24, a - TAU / 24), P(52, a), P(24, a + TAU / 24)], 'point'))),
      L('c2', circ(24)),
      L('c3', circ(10)),
    ],
  },
  {
    id: 'paisley',
    name: 'Mango paisley',
    layers: () => [
      L('lf', A(6, TAU / 12, (a) => leaf(72, 94, a, 0.25))),
      L('d', A(6, 0, (a) => dot(88, a, 3.8))),
      L('pz', A(6, 0, (a) => {
        const p = P(58, a);
        return raw('paisley', tp(PAIS, xf(p[0], p[1], a, 0.7)), '58', 58);
      })),
      L('pe', A(6, 0, (a) => {
        const p = P(58, a);
        const e = xf(p[0], p[1], a, 0.7)(2, 0);
        return circAt(5, e[0], e[1]);
      })),
      L('cp', A(6, TAU / 12, (a) => petal(9, 32, a, 0.42))),
      L('c', circ(10)),
    ],
  },
  {
    id: 'square',
    name: 'Square courtyard',
    layers: () => [
      L('fr', raw('frame', 'M-94 -94H94V94H-94ZM-86 -86H86V86H-86Z')),
      L('cn', [
        poly([[-86, -86], [0, -86], [-86, 0]], 'corner'),
        poly([[86, -86], [86, 0], [0, -86]], 'corner'),
        poly([[86, 86], [0, 86], [86, 0]], 'corner'),
        poly([[-86, 86], [-86, 0], [0, 86]], 'corner'),
      ]),
      L('cf', [circAt(12, -57, -57), circAt(12, 57, -57), circAt(12, 57, 57), circAt(12, -57, 57)]),
      L('dm', poly([[0, -86], [86, 0], [0, 86], [-86, 0]], 'diamond')),
      L('dd', A(4, 0, (a) => dot(72, a, 5))),
      L('rg', ring(50, 58)),
      L('pt', A(8, 0, (a) => petal(14, 48, a, 0.3))),
      L('c', circ(14)),
    ],
  },
  {
    id: 'fish',
    name: 'Fish pair',
    layers: () => [
      L('f', ring(86, 94)),
      L('ft', [fish('fish-tail', FT, 0, -34), fish('fish-tail', FT, Math.PI, 34)]),
      L('ff', [fish('fish-fin', FF, 0, -34), fish('fish-fin', FF, Math.PI, 34)]),
      L('fb', [fish('fish-body', FB, 0, -34), fish('fish-body', FB, Math.PI, 34)]),
      L('fs', [fish('fish-stripe', FS(2, 19), 0, -34, ':1'), fish('fish-stripe', FS(-14, 15), 0, -34, ':2'), fish('fish-stripe', FS(2, 19), Math.PI, 34, ':1'), fish('fish-stripe', FS(-14, 15), Math.PI, 34, ':2')]),
      L('fe', [circAt(4.5, 26, -38), circAt(4.5, -26, 38)]),
      L('bub', [circAt(4, 52, -44), circAt(3, 60, -54), circAt(4, -52, 44), circAt(3, -60, 54)]),
    ],
  },
];
