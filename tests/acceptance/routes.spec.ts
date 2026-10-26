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
  await expect(page.locator('main h1')).toBeVisible();
  const group = page.getByRole('button', { name: 'Platform', exact: true });
  await group.click();
  await page.getByRole('link', { name: 'Search & Investigation' }).first().click();
  await expect(page).toHaveURL(/\/platform\/search-investigation$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every investigation');
  await page.goBack();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/');
});

test('Early navigation stays open when Home commits during a link press', async ({ page }) => {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/HomePage-[\w-]+\.js$/, async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto('./', { waitUntil: 'commit' });
    await expect(page.locator('main .route-fallback')).toBeVisible();
    await expect(page.locator('footer')).toHaveCount(0);
    const group = page.getByRole('button', { name: 'Platform', exact: true });
    await group.click();
    const link = page
      .locator('#nav-panel-0')
      .getByRole('link', { name: 'Search & Investigation', exact: true });
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(link).toBeVisible();
    // The held page import can keep WebKit's document in its loading state.
    // Load only the menu font; document.fonts.ready also waits for document load.
    await link.evaluate(async (element) => {
      const style = getComputedStyle(element);
      await document.fonts.load(
        `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
        element.textContent ?? '',
      );
    });
    const before = await link.boundingBox();
    expect(before).not.toBeNull();
    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();

    // A lazy page and its footer must not close or move the navigation mid-gesture.
    release();
    await page.waitForLoadState('load');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(link).toBeVisible();
    const after = await link.boundingBox();
    expect(after).not.toBeNull();
    for (const axis of ['x', 'y', 'width', 'height'] as const) {
      expect(
        Math.abs(after![axis] - before![axis]),
        `Navigation link ${axis} stays stable`,
      ).toBeLessThanOrEqual(1);
    }
    await page.mouse.up();
    await expect(page).toHaveURL(/\/platform\/search-investigation$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every investigation');
    await page.goBack();
    await expect(page.locator('main')).toHaveAttribute('data-route', '/');
    await expect(page.locator('main h1')).toBeVisible();
  } finally {
    release();
    await page.mouse.up();
  }
});

test('Protected preview keeps unverified monitoring visibly conceptual', async ({ page }) => {
  await page.goto('./platform/monitoring');
  await expect(
    page.getByText('Concept demonstration · Not a live product capability'),
  ).toBeVisible();
});

test('Contact form does not claim to send without a backend', async ({ page }) => {
  await page.goto('./contact');
  await expect(page.locator('#contact-form .stage-form-actions button')).toHaveCount(1);
  await expect(page.locator('#contact-form')).not.toContainText('Message sent');
  await expect(page.getByRole('button', { name: 'Email us' })).toBeVisible();
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

for (const width of [390, 1440]) {
  test(`Cold anchored navigation keeps the language trigger available during a press: ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/PlatformPages-[\w-]+\.js$/, async (route) => {
      await held;
      await route.continue();
    });
    try {
      await page.goto('./platform/data-methodology?source=language#coverage', {
        waitUntil: 'commit',
      });
      await expect(page.locator('main .route-fallback')).toBeVisible();
      const trigger = page.locator('[data-language-selector]');
      await expect(trigger).toBeVisible();
      await trigger.evaluate(async (element) => {
        const style = getComputedStyle(element);
        await document.fonts.load(
          `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
          element.textContent ?? '',
        );
      });
      const box = await trigger.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      release();
      await page.waitForLoadState('load');
      await expect(page.locator('#coverage')).toBeInViewport();
      const header = page.locator('.site-header');
      await expect(header).toHaveAttribute('data-compact', 'true');
      await expect(header).toHaveAttribute('data-hidden', 'false');
      await page.mouse.up();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.language-panel')).toHaveCSS('opacity', '1');
      await page.getByRole('menuitemradio', { name: 'Русский', exact: true }).click();
      await expect(page).toHaveURL(
        /\/ru\/platform\/data-methodology\/?\?source=language#coverage$/,
      );
      await expect(page.locator('#coverage')).toBeInViewport();
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    } finally {
      release();
      await page.mouse.up();
    }
  });
}
