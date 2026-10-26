import { expect, test } from '@playwright/test';
import { chooseSelectOption } from '../helpers/select';

for (const reduced of [false, true]) {
  test(`same-page navigation preserves focus and uses appropriate motion: ${reduced}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto('./platform/search-investigation');
    await expect(page.locator('main h1')).toBeVisible();
    await page.evaluate(() => {
      const native = Element.prototype.scrollIntoView;
      (window as unknown as { scrollCalls: unknown[] }).scrollCalls = [];
      Element.prototype.scrollIntoView = function (options) {
        (window as unknown as { scrollCalls: unknown[] }).scrollCalls.push(options);
        native.call(this, options);
      };
    });
    await page.getByRole('link', { name: 'Starting a query', exact: true }).click();
    await expect(page.locator('#search-syntax')).toBeFocused();
    await expect(page).toHaveURL(/#search-syntax$/);
    const calls = await page.evaluate(
      () => (window as unknown as { scrollCalls: ScrollIntoViewOptions[] }).scrollCalls,
    );
    expect(calls.at(-1)?.behavior).toBe(reduced ? 'instant' : 'smooth');
    await expect(page.locator('#search-syntax')).toBeInViewport();
  });
}

test('skip link moves keyboard focus past navigation', async ({ page }) => {
  await page.goto('./contact');
  await expect(page.locator('main h1')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Start a conversation', exact: true })).toBeFocused();
});

test('pricing comparison goes to the complete table without a duplicate dialog', async ({
  page,
}) => {
  await page.goto('./pricing');
  await page.getByRole('link', { name: 'View a detailed comparison', exact: true }).click();
  await expect(page).toHaveURL(/#compare-plans$/);
  await expect(page.locator('#compare-plans')).toBeFocused();
  await expect(page.locator('.stage-plan-table')).toBeInViewport();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Business action lands on the named plan', async ({ page }) => {
  await page.goto('./teams');
  await page.getByRole('link', { name: 'View Business Plan', exact: true }).first().click();
  await expect(page).toHaveURL(/\/pricing#plan-business$/);
  await expect(page.locator('#plan-business')).toBeInViewport();
  await expect(page.locator('#plan-business')).toBeFocused();
});

for (const denied of [false, true]) {
  test(`API copy gives stable, recoverable feedback: denied=${denied}`, async ({ page }) => {
    await page.addInitScript((rejectCopy) => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            if (rejectCopy) throw new Error('Clipboard denied');
            (window as unknown as { copied: string }).copied = text;
          },
        },
      });
    }, denied);
    await page.goto('./developers/api');
    const button = page.locator('.stage-code-copy');
    const before = await button.boundingBox();
    await button.click();
    await expect(button).toHaveText(denied ? 'Selected' : 'Copied');
    expect((await button.boundingBox())!.width).toBe(before!.width);
    const code = await page.locator('.stage-code-window pre').innerText();
    expect(
      await page.evaluate(
        (failed) =>
          failed ? getSelection()?.toString() : (window as unknown as { copied: string }).copied,
        denied,
      ),
    ).toBe(code);
    await expect(button).toHaveText('Copy');
    await page.getByRole('button', { name: 'Response', exact: true }).click();
    await button.click();
    await expect(button).not.toHaveText('Copy');
    await page.getByRole('button', { name: 'Request', exact: true }).click();
    await expect(button).toHaveText('Copy');
  });
}

test('contact requirements are explicit and whitespace cannot bypass message length', async ({
  page,
}) => {
  await page.goto('./contact');
  await expect(page.locator('#contact-form [name="name"]')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Company (optional)')).not.toHaveAttribute('required');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Audit');
  await page.getByRole('textbox', { name: 'Work email', exact: true }).fill('audit@example.com');
  await chooseSelectOption(page.locator('#contact-form'), 'Other');
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('         ok         ');
  // No real email is sent: the invalid message must be rejected before the mailto action.
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Email us' }).click();
  await expect(page.locator('.stage-form-status')).toContainText('at least 10 characters');
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeFocused();
  await expect(page).toHaveURL(/\/contact\/?$/);
});

for (const width of [320, 768, 1440]) {
  test(`controls retain usable targets and form actions fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./contact');
    const form = page.locator('.stage-contact-form');
    await expect(form).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const formBounds = (await form.boundingBox())!;
    const actions = [];
    for (const name of ['Email us']) {
      const button = form.getByRole('button', { name, exact: true });
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      const bounds = (await button.boundingBox())!;
      expect(bounds.width, `${name} target width`).toBeGreaterThanOrEqual(44);
      expect(bounds.height, `${name} target height`).toBeGreaterThanOrEqual(44);
      expect(bounds.x, `${name} left edge`).toBeGreaterThanOrEqual(formBounds.x - 1);
      expect(bounds.x + bounds.width, `${name} right edge`).toBeLessThanOrEqual(
        formBounds.x + formBounds.width + 1,
      );
      expect(bounds.y, `${name} top edge`).toBeGreaterThanOrEqual(formBounds.y - 1);
      expect(bounds.y + bounds.height, `${name} bottom edge`).toBeLessThanOrEqual(
        formBounds.y + formBounds.height + 1,
      );
      actions.push({ name, ...bounds });
    }
    expect(
      Math.abs(actions[0]!.x - formBounds.x),
      'primary action starts at the form edge',
    ).toBeLessThan(1);
    await expect(form.locator('.stage-form-actions button')).toHaveCount(1);
    const topic = (await form.getByRole('combobox', { name: 'Topic' }).boundingBox())!;
    const chevron = (await form.locator('.select-field__trigger > svg').boundingBox())!;
    expect(Math.abs(chevron.y + chevron.height / 2 - topic.y - topic.height / 2)).toBeLessThan(1);
    expect(topic.x + topic.width - chevron.x - chevron.width).toBeGreaterThanOrEqual(14);
    expect(topic.x + topic.width - chevron.x - chevron.width).toBeLessThanOrEqual(18);
    expect((await page.locator('.footer-email').boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.goto('./developers/api');
    await expect(page.locator('.stage-code-copy')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.goto('./legal/privacy-policy');
    if (width >= 768) {
      const contentsLinks = page.locator('.legal-sidebar a');
      await expect(contentsLinks.first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const heights = await contentsLinks.evaluateAll((els) =>
        els.map((e) => e.getBoundingClientRect().height),
      );
      expect(heights.length).toBeGreaterThan(0);
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    }
  });
}
