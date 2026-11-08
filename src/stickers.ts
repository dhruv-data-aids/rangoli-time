import { TAU, rd } from './geometry/primitives';

const marigold = (() => {
  let s = '';
  for (let i = 0; i < 10; i++) {
    const a = (i * TAU) / 10;
    s += `<circle cx="${rd(5.6 * Math.sin(a))}" cy="${rd(-5.6 * Math.cos(a))}" r="3.4" fill="#FF9B1F" stroke="#D46A00" stroke-width=".5"/>`;
  }
  return s + '<circle r="4.2" fill="#E8590C"/><circle r="1.9" fill="#FFD12E"/>';
})();
const lp = 'M0 8Q6 -2 0 -10Q-6 -2 0 8Z';

/** Sticker artwork, drawn around (0,0) in a ~26 unit box. */
export const STK: Record<string, string> = {
  diya: '<path d="M0 -12C4.5 -7 4 -2.6 0 -1.6C-4 -2.6 -4.5 -7 0 -12Z" fill="#FFB020"/><path d="M0 -8.2C2.2 -5.6 1.8 -3 0 -2.6C-1.8 -3 -2.2 -5.6 0 -8.2Z" fill="#FFF3A6"/><path d="M-11 -1Q0 13 11 -1Z" fill="#C8622A" stroke="#F7F1E3" stroke-width=".7"/><path d="M-7 3.5Q0 7 7 3.5" fill="none" stroke="#FFD12E" stroke-width="1.2"/>',
  marigold,
  lotus: `<g fill="#FF97BE" stroke="#E8318E" stroke-width=".7"><path d="${lp}" transform="rotate(-70 0 8) scale(.8) translate(0 2)"/><path d="${lp}" transform="rotate(70 0 8) scale(.8) translate(0 2)"/><path d="${lp}" transform="rotate(-35 0 8)"/><path d="${lp}" transform="rotate(35 0 8)"/><path d="${lp}"/></g><path d="M-9 8.5Q0 13 9 8.5" fill="none" stroke="#1E9150" stroke-width="1.6" stroke-linecap="round"/>`,
  sparkle: '<path d="M0 -11Q1.8 -1.8 11 0Q1.8 1.8 0 11Q-1.8 1.8 -11 0Q-1.8 -1.8 0 -11Z" fill="#FFE066"/><circle r="1.8" fill="#FFFFFF"/>',
  leaf: '<path d="M0 -11Q8 0 0 11Q-8 0 0 -11Z" fill="#3FAE5A" stroke="#1E7A40" stroke-width=".6"/><path d="M0 -8V8" stroke="#BFF0C8" stroke-width=".8"/>',
  bindu: '<circle r="5" fill="#F7F1E3"/><circle r="2.3" fill="#E3262F"/>',
};
export const STK_NAMES: Record<string, string> = {
  diya: 'Diya lamp', marigold: 'Marigold', lotus: 'Lotus', sparkle: 'Sparkle', leaf: 'Leaf', bindu: 'Bindu dot',
};

export interface Sticker {
  t: string;
  x: number;
  y: number;
  rot?: number;
}

export const stickerEl = (s: Sticker): string =>
  STK[s.t] ? `<g transform="translate(${rd(s.x)} ${rd(s.y)}) rotate(${s.rot || 0})">${STK[s.t]}</g>` : '';

/** Positions for one tap: 1 sticker, or 8 rotated copies around the centre. */
export function placeStickers(type: string, x: number, y: number, around: boolean): Sticker[] {
  const r = Math.hypot(x, y);
  if (around && r > 8) {
    const th = Math.atan2(x, -y);
    return Array.from({ length: 8 }, (_, k) => {
      const a = th + (k * TAU) / 8;
      return { t: type, x: r * Math.sin(a), y: -r * Math.cos(a), rot: k * 45 };
    });
  }
  return [{ t: type, x, y, rot: 0 }];
}
