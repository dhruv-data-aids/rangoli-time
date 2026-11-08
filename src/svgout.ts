import type { FlatShape } from './grouping';
import { stickerEl, type Sticker } from './stickers';

export const BLANK = '#2F2938';
const TILE = '#25202C';
const CHALK = '#F7F1E3';

/** Markup for one piece in the live (CSS-styled) canvas. */
export const pathEl = (s: FlatShape, fill: string | null, cls = ''): string => {
  const c = fill ? cls : (cls + ' blank').trim();
  return `<path d="${s.d}" data-k="${s.k}" data-g="${s.g}"${fill ? ` style="fill:${fill}"` : ''}${c ? ` class="${c}"` : ''}/>`;
};
export const thumbSVG = (shapes: FlatShape[], fillFn: (s: FlatShape) => string | null, extra = ''): string =>
  `<svg viewBox="-100 -100 200 200" class="mini"><g class="art">${shapes.map((s) => pathEl(s, fillFn(s))).join('')}${extra}</g></svg>`;

/**
 * A self-contained SVG of the finished picture (no CSS needed), so it can be
 * stored, shown in an <img>, exported, and drawn to a canvas for the PNG.
 */
export function standaloneSvg(shapes: FlatShape[], fillFn: (s: FlatShape) => string | null, stickers: Sticker[]): string {
  const paths = shapes.map((s) => `<path d="${s.d}" fill="${fillFn(s) ?? BLANK}"/>`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" width="800" height="800">` +
    `<defs><pattern id="kd" x="-7.14" y="-7.14" width="14.28" height="14.28" patternUnits="userSpaceOnUse"><circle cx="7.14" cy="7.14" r=".5" fill="${CHALK}" fill-opacity=".17"/></pattern></defs>` +
    `<rect x="-100" y="-100" width="200" height="200" fill="${TILE}"/><rect x="-100" y="-100" width="200" height="200" fill="url(#kd)"/>` +
    `<g fill-rule="evenodd" stroke="${CHALK}" stroke-width=".9" stroke-linejoin="round">${paths}</g>` +
    `<g>${stickers.map(stickerEl).join('')}</g></svg>`
  );
}

export const svgDataUrl = (svg: string): string => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/** Rasterise a saved picture to a PNG (for Photos / sharing). */
export function svgToPng(svg: string, size = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return reject(new Error('no canvas'));
      ctx.drawImage(img, 0, 0, size, size);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    };
    img.onerror = () => reject(new Error('could not draw picture'));
    img.src = svgDataUrl(svg);
  });
}
