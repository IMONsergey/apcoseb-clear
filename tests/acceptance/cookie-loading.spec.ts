import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(
  readFileSync(new URL('../../dist/.vite/manifest.json', import.meta.url), 'utf8'),
) as Record<string, { file: string; css?: string[]; isDynamicEntry?: boolean }>;
const body = manifest['src/components/ui/CookiePreferencesBody.tsx'];
if (!body?.isDynamicEntry) throw new Error('Cookie content must remain a deferred dynamic entry.');
const bodyUrl = (url: URL) => url.pathname.endsWith('/' + body.file);

async function holdCookieBody(page: Page) {
  let release!: () => void;
  let announce!: (url: string) => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<string>((resolve) => {
    announce = resolve;
  });
  let count = 0;
  const handler = async (route: import('@playwright/test').Route) => {
    count++;
    announce(route.request().url());
    await gate;
    await route.continue().catch(() => undefined);
  };
  await page.route(bodyUrl, handler);
  return { started, release, count: () => count, stop: () => page.unroute(bodyUrl, handler) };
}
const trigger = (page: Page) =>
  page.locator('.legal-tools').getByRole('button', { name: 'Cookie Preferences' });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Cookie Preferences' });
const saved = (page: Page) =>
  page.evaluate(() => localStorage.getItem('apcosys-cookie-preferences'));

test('cookie content and its CSS load only on first opening and preserve actual save feedback', async ({
  page,
}) => {
  const held = await holdCookieBody(page);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  try {
    await page.goto('./legal/cookie-policy');
    await expect(trigger(page)).toBeVisible();
    expect(held.count()).toBe(0);
    for (const file of body.css ?? [])
      expect(requests.some((path) => path.endsWith('/' + file))).toBe(false);
    await trigger(page).click();
    await held.started;
    await expect(dialog(page).getByRole('status')).toHaveText('Loading cookie preferences…');
    await expect(dialog(page).getByRole('button', { name: 'Close dialog' })).toBeVisible();
    await expect(dialog(page).getByRole('button', { name: 'Save Preferences' })).toHaveCount(0);
    expect(await saved(page)).toBeNull();
    held.release();
    await expect(dialog(page).getByRole('button', { name: 'Save Preferences' })).toBeVisible();
    for (const file of body.css ?? [])
      expect(requests.some((path) => path.endsWith('/' + file))).toBe(true);
    await dialog(page).getByRole('button', { name: 'Save Preferences' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('.cookie-feedback [role="status"]')).toHaveText(
      'Cookie preferences saved.',
    );
    expect(await saved(page)).toBe('essential');
    await expect(trigger(page)).toBeFocused();
    await trigger(page).click();
    await expect(dialog(page).getByRole('button', { name: 'Save Preferences' })).toBeVisible();
    expect(held.count()).toBe(1);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  } finally {
    held.release();
    await held.stop();
  }
});

test('cookie late content never reopens a dialog closed during loading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const close of ['escape', 'button', 'backdrop']) {
    const held = await holdCookieBody(page);
    try {
      await page.goto('./legal/cookie-policy');
      await trigger(page).click();
      const url = await held.started;
      await expect(dialog(page).getByRole('status')).toHaveText('Loading cookie preferences…');
      if (close === 'escape') await page.keyboard.press('Escape');
      else if (close === 'button')
        await dialog(page).getByRole('button', { name: 'Close dialog' }).click();
      else await page.mouse.click(2, 2);
      await expect(dialog(page)).toBeHidden();
      await expect(trigger(page)).toBeFocused();
      held.release();
      await page.evaluate(async (moduleUrl) => {
        await import(moduleUrl);
      }, url);
      await expect(dialog(page)).toBeHidden();
      await expect(trigger(page)).toBeFocused();
      await expect(page.locator('.cookie-feedback [role="status"]')).toBeEmpty();
      expect(await saved(page)).toBeNull();
      await trigger(page).click();
      await expect(dialog(page).getByRole('button', { name: 'Save Preferences' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog(page)).toBeHidden();
    } finally {
      held.release();
      await held.stop();
    }
  }
});

test('cookie load failure offers real reload recovery without changing the page URL or saving early', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let unavailable = true;
  await page.route(bodyUrl, (route) => (unavailable ? route.abort() : route.continue()));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./legal/cookie-policy?keep=preferences#cookie-recovery');
  const url = page.url();
  for (const close of ['escape', 'button', 'backdrop']) {
    await trigger(page).click();
    await expect(dialog(page).getByRole('alert')).toHaveText('Cookie preferences could not load.');
    await expect(dialog(page).getByRole('button', { name: 'Reload page' })).toBeVisible();
    await expect(dialog(page).getByRole('button', { name: 'Save Preferences' })).toHaveCount(0);
    expect(await saved(page)).toBeNull();
    if (close === 'escape') await page.keyboard.press('Escape');
    else if (close === 'button')
      await dialog(page).getByRole('button', { name: 'Close dialog' }).click();
    else await page.mouse.click(2, 2);
    await expect(dialog(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  }
  await trigger(page).click();
  await expect(dialog(page).getByRole('alert')).toBeVisible();
  unavailable = false;
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    dialog(page).getByRole('button', { name: 'Reload page' }).click(),
  ]);
  expect(page.url()).toBe(url);
  await trigger(page).click();
  await expect(dialog(page).getByRole('button', { name: 'Save Preferences' })).toBeVisible();
  expect(await saved(page)).toBeNull();
  await dialog(page).getByRole('button', { name: 'Save Preferences' }).click();
  await expect(dialog(page)).toBeHidden();
  expect(await saved(page)).toBe('essential');
  await expect(page.locator('.cookie-feedback [role="status"]')).toHaveText(
    'Cookie preferences saved.',
  );
  expect(errors).toEqual([]);
});
