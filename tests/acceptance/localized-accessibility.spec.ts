import { expect, test } from '@playwright/test';
import { wcagAxe } from '../helpers/accessibility';
import { openLanguageMenu } from '../helpers/locale';
import { chooseSelectOption } from '../helpers/select';

for (const prefix of ['ru', 'zh-hant']) {
  for (const theme of ['light', 'dark']) {
    test(`localized disclosures, pricing dialog and validation remain accessible: ${prefix} ${theme}`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
      const scan = async (state: string) => {
        const results = await wcagAxe(page).analyze();
        expect(
          results.violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          })),
          state,
        ).toEqual([]);
      };
      await page.goto(`./${prefix}/`);
      await expect(page.locator('main h1')).toBeVisible();
      await openLanguageMenu(page);
      await scan('language disclosure');
      await page.keyboard.press('Escape');
      await page.locator('.menu-toggle').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await scan('mobile navigation');
      await page.keyboard.press('Escape');

      await page.goto(`./${prefix}/pricing`);
      await page.locator('#plan-plus .plan-button').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await scan('pricing dialog');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);

      await page.goto(`./${prefix}/contact`);
      await page.locator('[name="name"]').fill('Test');
      await page.locator('[name="email"]').fill('test@example.com');
      await chooseSelectOption(page.locator('#contact-form'), 'Other');
      await page.locator('[name="message"]').fill('     ok     ');
      await page.locator('#contact-form [name="consent"]').check();
      await page.locator('.stage-contact-submit').click();
      await expect(page.locator('.stage-form-status')).toBeVisible();
      await expect(page.locator('[name="message"]')).toBeFocused();
      await scan('form validation');
    });
  }
}
