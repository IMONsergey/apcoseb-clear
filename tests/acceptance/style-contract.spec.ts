import { expect, test } from '@playwright/test';
import { legalRoutes } from '../../src/content/legal-routes';
import { deploymentSettings } from '../helpers/public-settings';

for (const width of [320, 390, 600, 768, 900, 1000, 1280, 1440, 1920]) {
  test(`legal first screen stays aligned across all documents at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('.' + legalRoutes[0].path);
    const positions: number[][] = [];
    for (const route of legalRoutes) {
      const navigation = page.getByRole('navigation', { name: 'Legal documents' });
      if (route !== legalRoutes[0])
        await navigation.getByRole('link', { name: route.title, exact: true }).click();
      await expect(page.locator('main h1')).toHaveText(route.title);
      await page.evaluate(() => document.fonts.ready);
      positions.push(
        await page.evaluate(() =>
          ['.legal-description', '.legal-updated', '.legal-documents', '.legal-layout'].map(
            (selector) => document.querySelector(selector)!.getBoundingClientRect().top + scrollY,
          ),
        ),
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    for (let column = 0; column < positions[0]!.length; column++) {
      const values = positions.map((row) => row[column]!);
      expect(
        Math.max(...values) - Math.min(...values),
        JSON.stringify(positions),
      ).toBeLessThanOrEqual(1);
    }
  });
}

for (const width of [390, 1440]) {
  test(`Sign In is a grey animated link to the client site at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('./');
    if (width < 1200) await page.getByRole('button', { name: 'Open navigation' }).click();
    const scope =
      width < 1200
        ? page.getByRole('dialog', { name: 'Navigation' })
        : page.locator('.site-header');
    const link = scope.getByRole('link', { name: 'Sign In', exact: true });
    await expect(link).toHaveAttribute('href', deploymentSettings.signInUrl);
    await expect(link).not.toHaveAttribute('aria-disabled', 'true');
    const style = await link.evaluate((e) => ({
      background: getComputedStyle(e).backgroundColor,
      transition: getComputedStyle(e).transitionDuration,
      pointer: getComputedStyle(e).pointerEvents,
    }));
    expect(style.background).toBe('rgb(236, 238, 241)');
    expect(style.transition.split(',').some((value) => parseFloat(value) > 0)).toBe(true);
    expect(style.pointer).not.toBe('none');
    await page.route(deploymentSettings.signInUrl, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<h1>Client website</h1>' }),
    );
    await link.click();
    await expect(page).toHaveURL(deploymentSettings.signInUrl);
  });
}
