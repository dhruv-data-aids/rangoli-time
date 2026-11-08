import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the project at /rangoli-time/. Override with VITE_BASE=/ for a root deploy.
const base = process.env.VITE_BASE ?? '/rangoli-time/';

export default defineConfig({
  base,
  build: { target: 'es2020' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rangoli Time',
        short_name: 'Rangoli',
        description: 'Color and make rangoli patterns.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#1A171F',
        theme_color: '#1A171F',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,woff,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
});
