import { expect, type Page } from '@playwright/test';

export async function revealHeader(page: Page) {
  const header = page.locator('.site-header');
  await expect
    .poll(async () => {
      const before = await page.evaluate(() => scrollY);
      await page.waitForTimeout(80);
      return before === (await page.evaluate(() => scrollY));
    })
    .toBe(true);

  if ((await header.getAttribute('data-hidden')) === 'true') {
    const viewport = page.viewportSize()!;
    await page.mouse.move(8, viewport.height / 2);
    await page.mouse.wheel(0, -80);
    await expect(header).toHaveAttribute('data-hidden', 'false');
  }

  await expect(header).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
}

export async function openLanguageMenu(page: Page) {
  await revealHeader(page);
  const trigger = page.locator('[data-language-selector]');
  await trigger.click();
  await expect(page.locator('.language-panel')).toHaveCSS('opacity', '1');

  return {
    trigger,
    english: page.getByRole('menuitemradio', { name: 'English', exact: true }),
    russian: page.getByRole('menuitemradio', { name: 'Русский', exact: true }),
    chinese: page.getByRole('menuitemradio', { name: '中文', exact: true }),
  };
}
