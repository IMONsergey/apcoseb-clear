import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

for (const route of siteRoutes) {
  test(`Route ${route.path} resolves with a unique heading`, async ({ page }) => {
    await page.goto(`.${route.path === '/' ? '/' : route.path}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(/Apcosys/i);
    await expect(page.locator('main')).toHaveAttribute('data-route', route.path);
    await expect(page.locator('.site-header')).toHaveCount(1);
    await expect(page.locator('.footer')).toHaveCount(1);
  });
}

test('Navigation changes URL and supports browser back', async ({ page }) => {
  await page.goto('./');
  const group = page.getByRole('button', { name: 'Platform', exact: true });
  await group.click();
  await page.getByRole('link', { name: 'Search & Investigation' }).first().click();
  await expect(page).toHaveURL(/\/platform\/search-investigation$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every investigation');
  await page.goBack();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/');
});

test('Protected preview keeps unverified monitoring visibly conceptual', async ({ page }) => {
  await page.goto('./platform/monitoring');
  await expect(
    page.getByText('Concept demonstration · Not a live product capability'),
  ).toBeVisible();
  await expect(
    page.getByText('does not connect to live scans or alerts', { exact: false }),
  ).toBeVisible();
});

test('Contact form does not claim to send without a backend', async ({ page }) => {
  await page.goto('./contact');
  await expect(
    page.getByText('Messages are not stored or delivered by this website.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prepare email' })).toBeVisible();
  await expect(page.getByLabel('Work email')).toHaveAttribute('type', 'email');
});

test('Cookie preferences disclose disabled analytics', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Cookie Preferences' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cookie Preferences' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Analytics', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Save Preferences' }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('apcosys-cookie-preferences'))).toBe(
    'essential',
  );
});
