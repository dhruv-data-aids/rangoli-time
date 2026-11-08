import { expect, test } from '@playwright/test';

test.skip(({ browserName }) => browserName !== 'chromium', 'installability is checked in Chromium');

test('installable: manifest, icons, service worker, works offline', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await page.request.get(new URL(href!, page.url()).toString());
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('Rangoli Time');
  expect(m.display).toBe('standalone');
  expect(m.start_url).toBeTruthy();
  const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const i of m.icons) expect((await page.request.get(new URL(i.src, page.url()).toString())).ok()).toBe(true);
  expect(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')).toBeTruthy();

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#art .art path').first()).toBeVisible();
  await expect(page.locator('.brand')).toContainText('Rangoli Time');
  // font is self-hosted, not fetched from Google
  const external = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => !n.startsWith(location.origin)));
  expect(external).toEqual([]);
});
