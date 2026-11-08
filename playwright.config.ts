import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
// Playwright's bundled browsers don't support older macOS. Locally run with PW_CHANNEL=chrome to use the
// installed Google Chrome (WebKit projects are skipped then). CI uses the bundled Chromium + WebKit.
const systemChrome = process.env.PW_CHANNEL === 'chrome';
const landscape = { width: 1024, height: 768 };
const portrait = { width: 768, height: 1024 };

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}/rangoli-time/`, trace: 'retain-on-failure' },
  projects: [
    { name: 'ipad-landscape', use: { ...devices['Desktop Chrome'], ...(systemChrome ? { channel: 'chrome' } : {}), viewport: landscape } },
    { name: 'ipad-portrait', use: { ...devices['Desktop Chrome'], ...(systemChrome ? { channel: 'chrome' } : {}), viewport: portrait } },
    ...(systemChrome
      ? []
      : [
          { name: 'webkit-landscape', use: { ...devices['Desktop Safari'], viewport: landscape } },
          { name: 'webkit-portrait', use: { ...devices['Desktop Safari'], viewport: portrait } },
        ]),
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/rangoli-time/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
