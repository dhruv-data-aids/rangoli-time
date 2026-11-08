// Renders the app icons from the logo geometry. Run: npm run icons
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { A, petal } from '../src/geometry/primitives.ts';

const BG = '#1A171F';
const logo = A(6, 0, (a) => `<path d="${petal(10, 92, a, 0.5).d}" fill="#FFC83D"/>`).join('') + '<circle r="26" fill="#E3262F"/>';

/** scale < 1 leaves room around the logo (needed for maskable icons: keep inside the central 80%). */
const svg = (size, scale, rounded) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-100 -100 200 200">` +
  `<rect x="-100" y="-100" width="200" height="200" rx="${rounded ? 40 : 0}" fill="${BG}"/><g transform="scale(${scale})">${logo}</g></svg>`;

const out = async (name, size, scale, rounded = false) =>
  sharp(Buffer.from(svg(size, scale, rounded))).png().toFile(`public/${name}`);

await out('icon-192.png', 192, 0.9);
await out('icon-512.png', 512, 0.9);
await out('icon-maskable-512.png', 512, 0.66);
await out('apple-touch-icon.png', 180, 0.86); // iOS rounds the corners itself, so keep it square and opaque
writeFileSync('public/favicon.svg', svg(64, 0.92, true));
console.log('icons written to public/');
