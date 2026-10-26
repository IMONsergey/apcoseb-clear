import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openLanguageMenu } from '../helpers/locale';

const visit = async (page: Page, width = 1440) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('./', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

const priceAnimations = (page: Page) =>
  page
    .locator('#plan-plus .price-amount')
    .evaluate(
      (node) =>
        node
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running').length,
    );

test('language disclosure keeps the soft navigation treatment with all locales available', async ({
  page,
}) => {
  await visit(page);

  const platform = page.getByRole('button', { name: 'Platform', exact: true });
  await platform.click();

  const menu = await openLanguageMenu(page);
  await expect(platform).toHaveAttribute('aria-expanded', 'false');
  await expect(menu.english).toHaveAttribute('aria-checked', 'true');
  await expect(menu.russian).toBeEnabled();
  await expect(menu.chinese).toBeEnabled();
  await expect(menu.chinese).toHaveAttribute('lang', 'zh-Hant');
  // Navigation and language menus share the canonical elevated surface.
  await expect(page.locator('.language-panel')).toHaveCSS('background-color', 'rgb(236, 238, 241)');
  await expect(menu.russian).toHaveCSS('opacity', '1');

  await page.keyboard.press('Escape');
  await expect(menu.trigger).toBeFocused();
});

test('language menu keyboard dismissal stays stable', async ({ page }) => {
  await visit(page, 390);

  const menu = await openLanguageMenu(page);
  // Pointer activation keeps focus on the trigger and no longer paints English.
  await expect(menu.trigger).toBeFocused();
  await expect(menu.english).not.toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(menu.english).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu.trigger).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('prices retain the digit-reel animation in both directions and rapid switches settle correctly', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await visit(page);
  await page.locator('#pricing').scrollIntoViewIfNeeded();

  // Record real WAAPI starts; a parallel browser may finish the 620ms motion
  // before the assertion runs. Keep native animations and final-state checks.
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<typeof animate>) {
      const animation = animate.apply(this, args);
      const price = this.closest<HTMLElement>('#plan-plus .price-amount');
      if (price && this.matches('.price-digit__reel')) {
        price.dataset.startedAnimations = String(Number(price.dataset.startedAnimations ?? 0) + 1);
      }
      return animation;
    };
  });
  const starts = async () =>
    Number(await page.locator('#plan-plus .price-amount').getAttribute('data-started-animations'));

  const annual = page.getByRole('radio', { name: 'Annually', exact: true });
  const monthly = page.getByRole('radio', { name: 'Monthly', exact: true });

  await expect(annual).toBeChecked();
  await monthly.check();
  await expect(page.locator('.price-amount')).toHaveText(['$0', '$50', '$300', '$900']);
  await expect.poll(starts).toBeGreaterThan(0);
  const monthlyStarts = await starts();
  expect(await page.locator('.price-digit__reel').count()).toBeGreaterThan(0);

  await annual.check();
  await expect(page.locator('.price-amount')).toHaveText(['$0', '$40', '$240', '$720']);
  await expect.poll(starts).toBeGreaterThan(monthlyStarts);

  await annual.check();
  await monthly.check();
  await annual.check();
  await expect(page.locator('.price-amount')).toHaveText(['$0', '$40', '$240', '$720']);
});

test('reduced motion preserves the selected price without a running reel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visit(page);
  await page.locator('#pricing').scrollIntoViewIfNeeded();

  await page.getByRole('radio', { name: 'Annually', exact: true }).check();
  await expect(page.locator('.price-amount')).toHaveText(['$0', '$40', '$240', '$720']);
  expect(await priceAnimations(page)).toBe(0);
});

test('marquee keeps scrolling during hover and focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await visit(page);

  const trust = page.locator('.trust');
  await trust.scrollIntoViewIfNeeded();
  await expect(trust).toHaveAttribute('data-running', 'true');

  const viewport = trust.locator('.trust-viewport');
  await viewport.hover();
  await viewport.focus();
  const track = viewport.locator('.trust-track');
  await expect(track).toHaveCSS('animation-play-state', 'running');
  const transform = await track.evaluate((node) => getComputedStyle(node).transform);
  await expect
    .poll(() => track.evaluate((node) => getComputedStyle(node).transform))
    .not.toBe(transform);
});

test('language controls have no serious accessibility violations', async ({ page }) => {
  await visit(page, 390);

  const menu = await openLanguageMenu(page);
  await expect(menu.russian).toBeEnabled();

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'),
  ).toEqual([]);
});
