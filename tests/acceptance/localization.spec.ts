import { expect, test } from '@playwright/test';
import ru from '../../src/i18n/translations/ru';
import zhHant from '../../src/i18n/translations/zh-Hant';
import { openLanguageMenu } from '../helpers/locale';
import { localizedMetadata } from '../../src/i18n/route-metadata';
import { localizedRoutes } from '../../src/i18n/localized-routes';
import { formatTypography } from '../../src/i18n/typography';

const catalogs: Record<'ru' | 'zh-Hant', Record<string, string>> = { ru, 'zh-Hant': zhHant };
const translated = (locale: keyof typeof catalogs, source: string) =>
  catalogs[locale][source] ?? source;
const escapeHtml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

test('English URLs, content and metadata remain unchanged', async ({ page, request }) => {
  const response = await request.get('./pricing/');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain('<html lang="en"');
  expect(html).toContain('<title>Pricing | Apcosys</title>');
  expect(html).toContain('content="Compare Apcosys plans, credits, limits and API access."');

  await page.goto('./pricing');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
  await expect(page).toHaveTitle('Pricing | Apcosys');
  await expect(page.locator('.site-header a[href$="/platform/search-investigation"]')).toHaveCount(
    1,
  );
});

for (const locale of ['ru', 'zh-Hant'] as const) {
  const prefix = locale === 'ru' ? 'ru' : 'zh-hant';

  test(`${locale} resolves the same nested route with localized static metadata`, async ({
    page,
    request,
  }) => {
    const response = await request.get(`./${prefix}/platform/search-investigation/`);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    const source = localizedMetadata['/platform/search-investigation'];
    const title = formatTypography(translated(locale, source.title), locale) + ' | Apcosys';
    const description = formatTypography(translated(locale, source.description), locale);
    expect(html).toContain(`<html lang="${locale}"`);
    expect(html).toContain(`<title>${escapeHtml(title)}</title>`);
    expect(html).toContain(`content="${escapeHtml(description)}"`);

    await page.goto(`./${prefix}/platform/search-investigation`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main')).toHaveAttribute(
      'data-route',
      '/platform/search-investigation',
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      formatTypography(translated(locale, 'Every investigation starts with a question.'), locale),
    );
    await expect(page).toHaveTitle(title);
  });
}

test('localized route metadata has translations in both catalogs', () => {
  for (const route of localizedRoutes) {
    const source = localizedMetadata[route];
    for (const locale of ['ru', 'zh-Hant'] as const) {
      expect(catalogs[locale][source.title], `${route} ${locale} title`).toBeTruthy();
      expect(catalogs[locale][source.description], `${route} ${locale} description`).toBeTruthy();
    }
  }
});

test('language selection keeps the equivalent route, query and hash', async ({ page }) => {
  await page.goto('./platform/data-methodology?source=language#coverage');
  await openLanguageMenu(page);
  await page.getByRole('menuitemradio', { name: 'Русский', exact: true }).click();

  await expect(page).toHaveURL(/\/ru\/platform\/data-methodology\/?\?source=language#coverage$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('[data-language-selector]')).toContainText('RU');
});

test('same-locale navigation stays in the SPA and legal links return to English', async ({
  page,
}) => {
  await page.goto('./ru/teams');
  await page.locator('.site-header a[href$="/ru/pricing"]').click();
  await expect(page).toHaveURL(/\/ru\/pricing\/?$/);
  await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

  await page.goto('./ru/contact');
  const legal = page.locator('a[href$="/legal/privacy-policy"]').first();
  await expect(legal).not.toHaveAttribute('href', /\/ru\/legal\//);
  await legal.click();
  await expect(page).toHaveURL(/\/legal\/privacy-policy\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
});

test('language menu exposes native radio semantics and a region-neutral Chinese mark', async ({
  page,
}) => {
  await page.goto('./zh-hant/pricing');
  await openLanguageMenu(page);
  const chinese = page.getByRole('menuitemradio', { name: '繁體中文', exact: true });
  await expect(chinese).toHaveAttribute('aria-checked', 'true');
  await expect(chinese).toHaveAttribute('lang', 'zh-Hant');
  expect((await chinese.locator('svg').innerHTML()).toLowerCase()).not.toContain('#de2910');
  await chinese.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitemradio', { name: 'Русский', exact: true })).toBeFocused();
});

test('localized runtime preserves verbatim and form values and publishes alternates', async ({
  page,
}) => {
  await page.goto('./ru/developers/api');
  await expect(page.locator('.stage-code-window pre')).toContainText('APCOSYS_API_ENDPOINT');
  await expect(page.locator('.locale-text .locale-text')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
  await expect(page.locator('link[rel="alternate"][hreflang="zh-Hant"]')).toHaveAttribute(
    'href',
    /\/zh-hant\/developers\/api$/,
  );

  await page.goto('./ru/');
  const input = page.locator('.search-preview [name="search_value"]');
  await input.fill('example.com  --  443');
  await expect(input).toHaveValue('example.com  --  443');
});

test('untranslated corporate and legal pages do not claim localized variants', async ({
  page,
  request,
}) => {
  for (const unsupported of ['about', 'responsible-scanning', 'legal/privacy-policy']) {
    const response = await request.get('./ru/' + unsupported + '/');
    const html = await response.text();
    expect(html).not.toContain(`<html lang="ru"`);
  }

  await page.goto('./ru/pricing');
  const aboutLink = page.locator('a[href$="/about"]').first();
  await expect(aboutLink).not.toHaveAttribute('href', /\/ru\/about/);
  await aboutLink.click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('a missing route canonically identifies itself instead of the homepage', async ({ page }) => {
  await page.goto('./ru/missing-route');
  await expect(page.locator('main')).toHaveAttribute('data-route', '/404');
  const url = new URL(page.url());
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    url.origin + url.pathname,
  );
});
