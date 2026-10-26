import { test, expect, type Page } from '@playwright/test';
import { revealHeader } from '../helpers/locale';

async function visit(page: Page, width = 1440, height = 1000) {
  await page.setViewportSize({ width, height });
  await page.goto('./', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

const platformDestinations = [
  'about',
  'platform/search-investigation',
  'platform/data-methodology',
  'platform/monitoring',
  'responsible-scanning',
  'docs/investors',
  'contact',
];

for (const locale of [
  {
    language: 'en',
    prefix: '',
    platform: 'Platform',
    labels: [
      'About',
      'Search & Investigation',
      'Data & Methodology',
      'Monitoring concept',
      'Responsible Scanning',
      'For Investors',
      'Talk to Us',
    ],
  },
  {
    language: 'ru',
    prefix: 'ru/',
    platform: 'Платформа',
    labels: [
      'О нас',
      'Поиск и исследование',
      'Данные и методология',
      'Концепция мониторинга',
      'Ответственное сканирование',
      'Инвесторам',
      'Связаться с нами',
    ],
  },
  {
    language: 'zh-Hant',
    prefix: 'zh-hant/',
    platform: '平台',
    labels: [
      '關於我們',
      '搜尋與調查',
      '資料與方法論',
      '監控概念',
      '負責任的掃描',
      '投資人',
      '聯絡我們',
    ],
  },
]) {
  test(`${locale.language} keeps all Platform links reachable in short desktop and mobile menus`, async ({
    page,
    baseURL,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 320 });
    await page.goto(`./${locale.prefix}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.language);
    const expectedHrefs = platformDestinations.map(
      (path) => new URL(`./${locale.prefix}${path}`, baseURL!).pathname,
    );

    const trigger = page
      .locator('.desktop-nav')
      .getByRole('button', { name: locale.platform, exact: true });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const panel = page.locator('#nav-panel-0');
    const desktopLinks = panel.getByRole('link');
    await expect(desktopLinks).toHaveCount(platformDestinations.length);
    await expect(desktopLinks).toHaveText(locale.labels);
    expect(
      await desktopLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual(expectedHrefs);
    await expect(panel).toBeInViewport({ ratio: 1 });
    await expect(desktopLinks.first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(desktopLinks.last()).toBeFocused();
    await expect(desktopLinks.last()).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();

    await page.setViewportSize({ width: 390, height: 600 });
    const toggle = page.locator('.menu-toggle');
    await toggle.click();
    const drawer = page.locator('dialog.mobile-navigation');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-modal-phase', 'open');
    await expect(drawer).toBeInViewport({ ratio: 1 });
    const bounds = await drawer.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeCloseTo(0, 0);
    expect(bounds!.y).toBeCloseTo(0, 0);
    expect(bounds!.width).toBeCloseTo(390, 0);
    expect(bounds!.height).toBeCloseTo(600, 0);

    const mobilePlatform = drawer.locator('.mobile-nav-group').first();
    await expect(mobilePlatform.locator('.eyebrow')).toHaveText(locale.platform);
    const mobileLinks = mobilePlatform.getByRole('link');
    await expect(mobileLinks).toHaveCount(platformDestinations.length);
    await expect(mobileLinks).toHaveText(locale.labels);
    expect(
      await mobileLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual(expectedHrefs);
    await expect(drawer.locator('.modal__header button')).toBeFocused();
    for (const link of await mobileLinks.all()) {
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      await expect(link).toBeInViewport({ ratio: 1 });
      expect(
        await link.evaluate((element) => {
          const header = element.closest('dialog')!.querySelector('.modal__header')!;
          return element.getBoundingClientRect().top >= header.getBoundingClientRect().bottom - 1;
        }),
        'the focused Platform link must remain below the sticky drawer heading',
      ).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
    await expect(toggle).toBeFocused();

    // The same viewport contract holds after the native entrance animation.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await toggle.click();
    await expect(drawer).toHaveAttribute('data-modal-phase', 'open');
    await expect(drawer).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
    await expect(toggle).toBeFocused();
  });
}

for (const width of [320, 390, 768, 1200, 1440, 1920]) {
  test('English content remains readable and intrinsic at ' + width + 'px', async ({ page }) => {
    await visit(page, width);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width + 1,
    );

    const overflow = await page
      .locator('main h1, main h2, main h3, main p')
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              !node.closest('[inert], [aria-hidden="true"], .sr-only') &&
              node.clientWidth > 0 &&
              node.scrollWidth > node.clientWidth + 2,
          )
          .map((node) => node.textContent),
      );

    expect(overflow).toEqual([]);
  });
}

for (const width of [390, 768, 1440]) {
  test(
    'expanded FAQ retains native disclosure and reflows at ' + width + 'px',
    async ({ page }) => {
      await visit(page, width);
      await page.locator('#faq').scrollIntoViewIfNeeded();

      const details = page.locator('.faq-list details').nth(1);
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
      await expect(details.locator('.faq-answer')).not.toHaveAttribute('inert');
    },
  );
}

for (const width of [390, 1440]) {
  test(
    'directional header keeps language menu and keyboard usable at ' + width + 'px',
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await visit(page, width);

      const header = page.locator('.site-header');
      await page.mouse.wheel(0, 1200);
      await expect(header).toHaveAttribute('data-hidden', 'true');

      await revealHeader(page);
      await page.locator('[data-language-selector]').click();
      await expect(page.locator('.language-panel')).toHaveCSS('opacity', '1');

      await page.keyboard.press('Escape');
      await expect(page.locator('[data-language-selector]')).toBeFocused();
    },
  );
}

test('application API remains static until viewed, then plays, pauses and resumes with navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await visit(page, 1440);

  const demo = page.locator('.application-scene[data-scene="api"]');
  await expect(demo).toHaveAttribute('data-demo-playback', 'static');
  await expect(demo.locator('.application-api__heading')).toHaveText('API access');
  await page.locator('#api').scrollIntoViewIfNeeded();
  await demo.scrollIntoViewIfNeeded();

  const cursorTransform = () =>
    demo
      .locator('.application-demo-cursor')
      .evaluate((cursor) => getComputedStyle(cursor).transform);
  await expect(demo).toHaveAttribute('data-demo-playback', 'playing');
  await expect(demo.locator('.application-demo-cursor')).toBeVisible();
  const initial = await cursorTransform();
  await expect.poll(cursorTransform).not.toBe(initial);

  await page.locator('.hero h1').scrollIntoViewIfNeeded();
  await expect(demo).toHaveAttribute('data-demo-playback', 'paused');
  const resting = {
    transform: await cursorTransform(),
    phase: await demo.getAttribute('data-demo-phase'),
  };
  await page.waitForTimeout(2100);
  expect({
    transform: await cursorTransform(),
    phase: await demo.getAttribute('data-demo-phase'),
  }).toEqual(resting);

  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toHaveAttribute('data-demo-playback', 'playing');
  const resumed = await cursorTransform();
  await expect.poll(cursorTransform).not.toBe(resumed);
});

test('reduced motion keeps globe visible and closing action usable on phone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visit(page, 390, 844);

  await page.locator('#data').scrollIntoViewIfNeeded();
  await expect(page.locator('.signal-globe canvas')).toBeVisible();

  await page.locator('.closing-section').scrollIntoViewIfNeeded();
  await expect(page.locator('.closing-copy .double-button')).toBeVisible();
});

test('footer underline feedback does not change geometry', async ({ page }) => {
  await visit(page, 1440);
  await page.locator('.footer').scrollIntoViewIfNeeded();

  const link = page.locator('.footer a').filter({ hasText: 'Search & Investigation' }).first();
  const before = await link.boundingBox();
  await link.hover();
  const after = await link.boundingBox();

  expect(after).toEqual(before);
});
