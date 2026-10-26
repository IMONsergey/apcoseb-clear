import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

async function settle(panel: Locator) {
  await panel.evaluate(async (element) => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

async function geometry(page: Page, section: string, next: string) {
  return page.evaluate(
    ({ section, next }) => {
      const panel = document.querySelector(section)!.getBoundingClientRect();
      const following = document.querySelector(next)!.getBoundingClientRect();
      return { height: panel.height, followingTop: following.top + scrollY };
    },
    { section, next },
  );
}

for (const locale of ['', 'ru/', 'zh-hant/']) {
  for (const width of [320, 390, 768, 1363, 1440]) {
    test(`tab panels preserve page geometry: ${locale || 'en'} ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 936 });
      await page.goto(`./${locale}`);
      const capabilities = page.locator('#capabilities');
      await expect(capabilities).toBeVisible();
      await capabilities.scrollIntoViewIfNeeded();
      await settle(page.locator('main'));
      const initial = await geometry(page, '#capabilities', '#audiences');
      const tabs = capabilities.locator('.home-capabilities__tabs button');
      for (const index of [1, 2, 3, 4, 0]) {
        await tabs.nth(index).click();
        await settle(capabilities);
        const current = await geometry(page, '#capabilities', '#audiences');
        expect(Math.abs(current.height - initial.height)).toBeLessThanOrEqual(1);
        expect(Math.abs(current.followingTop - initial.followingTop)).toBeLessThanOrEqual(1);
        const active = capabilities.locator('.home-capabilities__stage:visible');
        await expect(active).toHaveCount(1);
        await expect(capabilities.getByRole('button')).toHaveCount(
          5 + (await active.locator('button').count()),
        );
        await expect(capabilities.getByRole('link')).toHaveCount(
          await active.locator('a[href]').count(),
        );
        if (index === 1) {
          const filter = active.getByRole('checkbox');
          await filter.check();
          await settle(capabilities);
          await expect(active.getByText('80 / HTTP', { exact: true })).not.toBeVisible();
          await expect(active.getByText('22 / SSH', { exact: true })).not.toBeVisible();
          const filteredAccessibility = await active.ariaSnapshot();
          expect(filteredAccessibility).toContain('443 / HTTPS');
          expect(filteredAccessibility).not.toContain('80 / HTTP');
          expect(filteredAccessibility).not.toContain('22 / SSH');
          const filtered = await geometry(page, '#capabilities', '#audiences');
          expect(Math.abs(filtered.height - initial.height)).toBeLessThanOrEqual(1);
          expect(Math.abs(filtered.followingTop - initial.followingTop)).toBeLessThanOrEqual(1);
          await filter.uncheck();
        }
        if (
          process.env.APCO_PANEL_SCREENSHOTS === '1' &&
          locale === 'ru/' &&
          [390, 1363].includes(width) &&
          index === 3
        ) {
          await capabilities.screenshot({
            path: testInfo.outputPath('capabilities-buckets-ru.png'),
            animations: 'disabled',
          });
        }
      }
      expect(
        await capabilities.locator('.home-capabilities__stage[inert]').evaluateAll((panels) =>
          panels.every((panel) => {
            panel.querySelector<HTMLElement>('button, a, input')?.focus();
            return !panel.contains(document.activeElement);
          }),
        ),
      ).toBe(true);
      const ids = await capabilities
        .locator('[id]')
        .evaluateAll((elements) => elements.map((element) => element.id));
      expect(new Set(ids).size).toBe(ids.length);

      await page.goto(`./${locale}developers/api`);
      const code = page.locator('.stage-code-window');
      await expect(code).toBeVisible();
      await code.scrollIntoViewIfNeeded();
      await settle(page.locator('main'));
      const request = await geometry(page, '#documentation', '#api-capabilities');
      const codeTabs = code.locator('.stage-code-tabs button');
      await codeTabs.last().click();
      await settle(code);
      const response = await geometry(page, '#documentation', '#api-capabilities');
      expect(Math.abs(response.height - request.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(response.followingTop - request.followingTop)).toBeLessThanOrEqual(1);
      if (
        process.env.APCO_PANEL_SCREENSHOTS === '1' &&
        locale === 'ru/' &&
        [390, 1363].includes(width)
      ) {
        await code.screenshot({
          path: testInfo.outputPath('api-response-ru.png'),
          animations: 'disabled',
        });
      }
      const viewport = code.locator('pre');
      expect(
        await viewport.evaluate((element) => element.scrollHeight > element.clientHeight),
      ).toBe(true);
      await viewport.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      expect(await viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await codeTabs.first().click();
      await settle(code);
      expect(await viewport.evaluate((element) => element.scrollTop)).toBe(0);
      const restored = await geometry(page, '#documentation', '#api-capabilities');
      expect(Math.abs(restored.height - request.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(restored.followingTop - request.followingTop)).toBeLessThanOrEqual(1);
    });
  }
}
