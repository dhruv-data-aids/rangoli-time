import { $, pick } from '../dom';
import { PALETTE } from '../palette';
import { TAU, rd } from '../geometry/primitives';
import { sfx } from './sound';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

export function burst(x: number, y: number, n: number, spread: number): void {
  if (reduce.matches) return;
  const fx = $('fx');
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    const a = Math.random() * TAU;
    const d = spread * (0.4 + Math.random() * 0.6);
    s.style.cssText = `left:${x}px;top:${y}px;--dx:${rd(Math.cos(a) * d)}px;--dy:${rd(Math.sin(a) * d)}px;--c:${pick(PALETTE)[1]};--r:${Math.round(Math.random() * 360)}deg`;
    fx.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}
export function burstAtEvent(e: { clientX: number; clientY: number }, n: number, spread: number): void {
  const r = $('stage').getBoundingClientRect();
  burst(e.clientX - r.left, e.clientY - r.top, n, spread);
}
export function burstAtCenter(n: number, spread: number): void {
  const r = $('stage').getBoundingClientRect();
  const a = $('art').getBoundingClientRect();
  burst(a.left - r.left + a.width / 2, a.top - r.top + a.height / 2, n, a.width * spread);
}
export function celebrate(): void {
  burstAtCenter(44, 0.55);
  sfx.win();
}
