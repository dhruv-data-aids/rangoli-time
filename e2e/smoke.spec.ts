import { expect, test, type Page } from '@playwright/test';

const dots = '#art path[data-g="dot@93"]';

async function openApp(page: Page) {
  await page.goto('./');
  await expect(page.locator('#art .art path').first()).toBeVisible();
}
async function filledCount(page: Page, color: string) {
  return page.locator('#art .art path').evaluateAll((els, c) => els.filter((e) => (e as SVGElement).style.fill === c).length, color);
}

test('color, whole ring, make all 4 rings, save, reload, gallery survives', async ({ page }) => {
  await openApp(page);

  // Color: pick Rani pink (default) -> Whole ring colors all 16 dots on the circle
  await expect(page.getByRole('button', { name: 'Whole ring' })).toHaveAttribute('aria-pressed', 'true');
  const total = await page.locator(dots).count();
  expect(total).toBe(16);
  await page.locator(dots).first().click();
  expect(await filledCount(page, 'rgb(236, 51, 146)')).toBe(16);

  // One piece: only the tapped dot changes
  await page.getByRole('button', { name: 'One piece' }).click();
  await page.getByRole('button', { name: 'Sky blue' }).click();
  await page.locator(dots).first().click();
  expect(await filledCount(page, 'rgb(88, 198, 245)')).toBe(1);
  expect(await filledCount(page, 'rgb(236, 51, 146)')).toBe(15);

  // keep a colored copy in the gallery
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('Saved');

  // Make: build every ring
  await page.getByRole('tab', { name: 'Make' }).click();
  await page.getByRole('button', { name: 'Clear' }).click();
  for (let step = 0; step < 4; step++) {
    await page.locator(`.step[data-step="${step}"]`).click();
    await page.locator('#optStrip button[data-m]').first().click();
    await expect(page.locator(`.step[data-step="${step}"] i`)).toHaveCSS('background-color', /rgb\((?!0, 0, 0)/);
  }
  expect(await page.locator('#art .art path').count()).toBeGreaterThan(40);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('Saved');

  // Reload the page: gallery must still be there
  await page.reload();
  await expect(page.locator('#art .art path').first()).toBeVisible();
  await page.getByRole('tab', { name: 'Gallery' }).click();
  await expect(page.locator('.gcard')).toHaveCount(2);
  await expect(page.locator('.gcard .badge', { hasText: 'Made by me' })).toHaveCount(1);
  await expect(page.locator('.gcard .badge', { hasText: 'Colored · Lotus' })).toHaveCount(1);

  // filters
  await page.getByRole('button', { name: 'Made', exact: true }).click();
  await expect(page.locator('.gcard')).toHaveCount(1);
  await page.getByRole('button', { name: 'Colored', exact: true }).click();
  await expect(page.locator('.gcard')).toHaveCount(1);
  await page.getByRole('button', { name: 'All', exact: true }).click();

  // open, keep working (restores into the right mode)
  await page.locator('.gcard', { hasText: 'Made by me' }).click();
  await expect(page.locator('#viewer')).toBeVisible();
  await page.getByRole('button', { name: 'Keep working' }).click();
  await expect(page.getByRole('tab', { name: 'Make' })).toHaveAttribute('aria-selected', 'true');
  expect(await page.locator('#art .art path').count()).toBeGreaterThan(40);

  // delete needs two taps, no browser dialog
  page.on('dialog', () => { throw new Error('browser dialog used'); });
  await page.getByRole('tab', { name: 'Gallery' }).click();
  await page.locator('.gcard', { hasText: 'Colored' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.gcard')).toHaveCount(2); // still there after the first tap
  await page.getByRole('button', { name: 'Tap again to delete' }).click();
  await expect(page.locator('.gcard')).toHaveCount(1);
});

test('work in progress is autosaved across reloads', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Haldi yellow' }).click();
  await page.locator(dots).first().click();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator('#art .art path').first()).toBeVisible();
  expect(await filledCount(page, 'rgb(255, 209, 46)')).toBe(16);
});

test('touch targets are at least 48px', async ({ page }) => {
  await openApp(page);
  const small = await page.locator('button:visible').evaluateAll((els) =>
    els.map((e) => ({ n: e.getAttribute('aria-label') || e.textContent?.trim() || e.id, r: e.getBoundingClientRect() })).filter((x) => x.r.width < 47.5 || x.r.height < 47.5).map((x) => `${x.n} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`),
  );
  expect(small).toEqual([]);
});
