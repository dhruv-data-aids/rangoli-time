import { CENTER_KEYS, RING_KEYS } from './make-pieces';

/** A random full set of motifs: one centre + three rings, no ring repeating its neighbour. */
export function randomCfg(rand: () => number = Math.random): string[] {
  const pick = <T,>(a: T[]): T => a[Math.floor(rand() * a.length)];
  const r = [pick(CENTER_KEYS)];
  let prev = '';
  for (let i = 1; i < 4; i++) {
    let m: string;
    do m = pick(RING_KEYS);
    while (m === prev);
    prev = m;
    r.push(m);
  }
  return r;
}
