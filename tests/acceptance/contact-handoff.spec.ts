import { expect, test } from '@playwright/test';
import { chooseSelectOption } from '../helpers/select';
import { wcagAxe } from '../helpers/accessibility';

const topicLabels = {
  en: [
    'Data & coverage',
    'API access',
    'Team & Business plan',
    'Billing & invoices',
    'Responsible scanning',
    'Other',
  ],
  ru: [
    'Данные и покрытие',
    'Доступ к API',
    'Команда и тариф Business',
    'Оплата и счета',
    'Ответственное сканирование',
    'Другое',
  ],
  'zh-hant': [
    '資料與涵蓋範圍',
    'API 存取',
    '團隊與 Business 方案',
    '帳單與發票',
    '負責任的掃描',
    '其他',
  ],
};

for (const [locale, labels] of Object.entries(topicLabels)) {
  test(`${locale}: contact topics stay localized and changing them preserves the message`, async ({
    page,
  }) => {
    const path = locale === 'en' ? 'contact' : `${locale}/contact`;
    await page.goto(`./${path}`);
    await expect(page).toHaveURL(new RegExp(`/${path}/?$`));
    const form = page.locator('#contact-form');
    const topic = form.getByRole('combobox');
    await topic.click();
    await expect(form.getByRole('option')).toHaveText(labels);
    await expect(page.locator('select:visible')).toHaveCount(0);
    await topic.press('Escape');
    await form.locator('[name="name"]').fill('Contact review');
    await form.locator('[name="email"]').fill('review@example.com');
    const message = 'A local review of the prepared message.';
    await form.locator('[name="message"]').fill(message);
    for (const [index, value] of topicLabels.en.entries()) {
      await chooseSelectOption(form, value);
      await expect(form.locator('[name="topic"]')).toHaveValue(value);
      await expect(topic).toHaveText(labels[index]!);
      await expect(form.locator('[name="message"]')).toHaveValue(message);
    }
    await expect(form.locator('.stage-form-actions button')).toHaveCount(1);
    await expect(form.locator('.stage-prepared-email')).toHaveCount(0);
    await expect(form.locator('.stage-note')).toHaveCount(0);
  });
}

test('contact topic supports keyboard exploration, cancellation, typeahead and form values', async ({
  page,
}) => {
  await page.goto('./contact?topic=API%20access');
  const form = page.locator('#contact-form');
  const topic = form.getByRole('combobox', { name: 'Topic', exact: true });
  await topic.focus();
  await topic.press('ArrowDown');
  await expect(topic).toHaveAttribute('aria-expanded', 'true');
  await expect(form.getByRole('option', { selected: true })).toHaveText('API access');
  await topic.press('ArrowDown');
  await expect(form.getByRole('option', { selected: true })).toHaveText('Team & Business plan');
  await expect(topic).toHaveText('API access');
  await topic.press('Escape');
  await expect(topic).toBeFocused();
  await expect(topic).toHaveAttribute('aria-expanded', 'false');
  await expect(topic).toHaveText('API access');
  expect(await topic.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('none');
  expect(
    await topic
      .locator('.select-field__value')
      .evaluate((node) => getComputedStyle(node).textDecorationLine),
  ).toContain('underline');

  await topic.press('End');
  await expect(form.getByRole('option', { selected: true })).toHaveText('Other');
  await topic.press('Enter');
  await expect(topic).toHaveText('Other');
  await page.keyboard.type('bill');
  await expect(form.getByRole('option', { selected: true })).toHaveText('Billing & invoices');
  await topic.press('Tab');
  await expect(form.getByRole('textbox', { name: 'Message', exact: true })).toBeFocused();
  await expect(topic).toHaveText('Billing & invoices');
  expect(await form.evaluate((node: HTMLFormElement) => new FormData(node).get('topic'))).toBe(
    'Billing & invoices',
  );
});

test('dismissing the contact topic popup never changes a pending or existing choice', async ({
  page,
}) => {
  await page.goto('./contact');
  const form = page.locator('#contact-form');
  const topic = form.getByRole('combobox', { name: 'Topic', exact: true });
  await topic.click();
  await form.locator('[name="name"]').focus();
  await expect(topic).toHaveAttribute('aria-expanded', 'false');
  await expect(form.locator('[name="topic"]')).toHaveValue('');
  await topic.click();
  await page.locator('.stage-contact-aside h2').click();
  await expect(topic).toHaveAttribute('aria-expanded', 'false');
  await expect(topic).toHaveText('Select a topic');
  await expect(form.locator('[name="topic"]')).toHaveValue('');

  await chooseSelectOption(form, 'API access');
  await topic.click();
  await form.getByRole('option', { name: 'Other', exact: true }).hover();
  await expect(form.getByRole('option', { selected: true })).toHaveText('Other');
  await page.locator('.stage-contact-aside h2').click();
  await expect(topic).toHaveAttribute('aria-expanded', 'false');
  await expect(topic).toHaveText('API access');
  await expect(form.locator('[name="topic"]')).toHaveValue('API access');
});

test('an unselected required topic focuses the custom control and cannot submit', async ({
  page,
}) => {
  await page.goto('./contact');
  const form = page.locator('#contact-form');
  const topic = form.getByRole('combobox', { name: 'Topic', exact: true });
  await form.locator('[name="name"]').fill('Contact review');
  await form.locator('[name="email"]').fill('review@example.com');
  await form.locator('[name="message"]').fill('Please help with an API integration.');
  await form.locator('[name="consent"]').check();
  await form.getByRole('button', { name: 'Email us' }).click();
  await expect(topic).toBeFocused();
  await expect(topic).toHaveAttribute('aria-required', 'true');
  await expect(topic).toHaveAttribute('aria-invalid', 'true');
  await expect(form.getByRole('listbox')).toBeVisible();
  await expect(form.getByRole('alert')).toHaveText('Select a topic');
  await expect(page).toHaveURL(/\/contact\/?$/);
  await form.getByRole('option', { name: 'API access', exact: true }).click();
  await expect(topic).not.toHaveAttribute('aria-invalid');
  await expect(form.getByRole('alert')).toHaveCount(0);
  expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
  expect(await form.evaluate((node: HTMLFormElement) => new FormData(node).get('topic'))).toBe(
    'API access',
  );
});

for (const [locale, labels] of Object.entries(topicLabels)) {
  for (const theme of ['light', 'dark']) {
    for (const width of [320, 1440]) {
      test(`contact topic popup fits long labels and remains accessible: ${locale} ${theme} ${width}px`, async ({
        page,
      }) => {
        const height = width === 320 ? 700 : 1000;
        await page.setViewportSize({ width, height });
        await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
        await page.goto(locale === 'en' ? './contact' : `./${locale}/contact`);
        const form = page.locator('#contact-form');
        const topic = form.getByRole('combobox');
        await chooseSelectOption(form, 'Responsible scanning');
        await expect(topic).toHaveText(labels[4]!);
        await topic.click();
        const listbox = form.getByRole('listbox');
        await expect(listbox).toBeVisible();
        await expect(form.getByRole('option')).toHaveText(labels);
        const bounds = (await listbox.boundingBox())!;
        const header = (await page.locator('.site-header').boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(12);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width - 12);
        expect(bounds.y).toBeGreaterThanOrEqual(Math.max(0, header.y + header.height) - 1);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
        const rows = await form.getByRole('option').evaluateAll((options) =>
          options.map((option) => {
            const text = option.querySelector('span')!;
            return {
              height: option.getBoundingClientRect().height,
              overflow: text.scrollWidth - text.clientWidth,
            };
          }),
        );
        for (const row of rows) {
          expect(row.height).toBeGreaterThanOrEqual(44);
          expect(row.overflow).toBeLessThanOrEqual(1);
        }
        const accessibility = await wcagAxe(page).include('#contact-form').analyze();
        expect(accessibility.violations).toEqual([]);
        await page.screenshot({ path: test.info().outputPath('topic-open.png') });
        await form.getByRole('option', { name: labels[5]!, exact: true }).click();
        await expect(topic).toHaveText(labels[5]!);
        await expect(listbox).not.toBeVisible();
      });
    }
  }
}

test('changing the contact topic card clears stale validation without discarding the message', async ({
  page,
}) => {
  await page.goto('./contact');
  const form = page.locator('#contact-form');
  await form.locator('[name="name"]').fill('Contact review');
  await form.locator('[name="email"]').fill('review@example.com');
  await chooseSelectOption(form, 'Other');
  await form.locator('[name="message"]').fill('         ok         ');
  await form.locator('[name="consent"]').check();
  await form.getByRole('button', { name: 'Email us' }).click();
  await expect(form.locator('.stage-form-status')).toContainText('at least 10 characters');
  await page
    .locator('.contact-topics button')
    .filter({ has: page.getByRole('heading', { name: 'API & integration', exact: true }) })
    .click();
  await expect(form.locator('[name="topic"]')).toHaveValue('API access');
  await expect(form.locator('[name="name"]')).toBeFocused();
  await expect(form.locator('.stage-form-status')).toHaveCount(0);
  await expect(form.locator('[name="message"]')).toHaveValue('         ok         ');
});
