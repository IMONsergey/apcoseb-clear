import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

for (const width of [320, 768, 1440, 1920, 2560]) {
  test(`all pages share header, content and footer rails at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const route of siteRoutes) {
      await page.goto('.' + route.path);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const header = document.querySelector('.header-row')!.getBoundingClientRect();
        const containers = [...document.querySelectorAll('main .container, .footer .container')]
          .map((el) => ({ name: el.className, rect: el.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0)
          .map(({ name, rect }) => ({ name, left: rect.left, right: rect.right }));
        return {
          left: header.left,
          right: header.right,
          width: header.width,
          containers,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(geometry.overflow, route.path).toBeLessThanOrEqual(1);
      expect(geometry.width).toBeLessThanOrEqual(1441);
      for (const box of geometry.containers) {
        expect(
          Math.abs(box.left - geometry.left),
          `${route.path} ${box.name}: left`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(box.right - geometry.right),
          `${route.path} ${box.name}: right`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });
}

for (const width of [1440, 1920, 2560]) {
  test(`carousel cards keep the common rails and three-card measure at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('./');
    const first = page.locator('.step-card').first();
    await expect(first).toBeVisible();
    const geometry = await page.evaluate(() => {
      const rail = document.querySelector('.carousel-controls')!.getBoundingClientRect();
      const cards = [...document.querySelectorAll('.step-card')]
        .slice(0, 3)
        .map((el) => el.getBoundingClientRect());
      return { left: rail.left, right: rail.right, first: cards[0]!.left, third: cards[2]!.right };
    });
    expect(Math.abs(geometry.first - geometry.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.third - geometry.right)).toBeLessThanOrEqual(1);
  });
}

for (const width of [768, 1000]) {
  test(`contact gives form fields usable space at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('./contact');
    const form = page.locator('#contact-form');
    await expect(form).toBeVisible();
    const geometry = await page.evaluate(() => {
      const form = document.querySelector('#contact-form')!.getBoundingClientRect();
      const container = document.querySelector('.stage-contact-layout')!.getBoundingClientRect();
      const fields = [
        ...document.querySelectorAll('.stage-form-row input, .stage-form-row select'),
      ].map((el) => el.getBoundingClientRect().width);
      const topics = [...document.querySelectorAll('.contact-topics button')].map(
        (el) => el.getBoundingClientRect().y,
      );
      return { form: form.width, container: container.width, fields, topics };
    });
    expect(Math.abs(geometry.form - geometry.container)).toBeLessThanOrEqual(1);
    expect(Math.min(...geometry.fields)).toBeGreaterThanOrEqual(220);
    expect(new Set(geometry.topics.map((y) => Math.round(y))).size).toBe(3);
    await page.getByRole('button', { name: /Teams & procurement/ }).click();
    await expect(page.getByRole('combobox', { name: 'Topic', exact: true })).toHaveValue(
      'Team & Business plan',
    );
  });
}

test('homepage API title, description and action start on the shared rail', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('./');
  await expect(page.locator('.api-copy h2')).toBeVisible();
  const offsets = await page.evaluate(() => {
    const left = document.querySelector('.api-grid')!.getBoundingClientRect().left;
    return [
      ...document.querySelectorAll('.api-copy h2, .api-copy p, .api-copy > .double-button'),
    ].map((el) => el.getBoundingClientRect().left - left);
  });
  for (const offset of offsets) expect(Math.abs(offset)).toBeLessThanOrEqual(1);
});
