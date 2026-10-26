import { expect, test, type Page } from '@playwright/test';
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
const staticDocumentLanguage = (page: Page, html: string) =>
  page.evaluate(
    (markup) =>
      new DOMParser().parseFromString(markup, 'text/html').documentElement.getAttribute('lang'),
    html,
  );

test('English URLs, content and metadata remain unchanged', async ({ page, request }) => {
  const response = await request.get('./pricing/');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(await staticDocumentLanguage(page, html)).toBe('en');
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
    expect(await staticDocumentLanguage(page, html)).toBe(locale);
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

test('same-locale navigation includes legal pages and the language menu opens the English source', async ({
  page,
}) => {
  await page.goto('./ru/teams');
  await page.locator('.site-header a[href$="/ru/pricing"]').click();
  await expect(page).toHaveURL(/\/ru\/pricing\/?$/);
  await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

  await page.goto('./ru/contact');
  const legal = page.locator('a[href$="/legal/privacy-policy"]').first();
  await expect(legal).toHaveAttribute('href', /\/ru\/legal\//);
  await legal.click();
  await expect(page).toHaveURL(/\/ru\/legal\/privacy-policy\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
  await expect(page.locator('.legal-translation')).toHaveCount(0);
  const languages = await openLanguageMenu(page);
  await languages.english.click();
  await expect(page).toHaveURL(/\/legal\/privacy-policy\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.legal-translation')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
});

test('language menu retains Traditional Chinese and uses the requested PRC flag', async ({
  page,
}) => {
  await page.goto('./zh-hant/pricing');
  await openLanguageMenu(page);
  const chinese = page.getByRole('menuitemradio', { name: '繁體中文', exact: true });
  await expect(chinese).toHaveAttribute('aria-checked', 'true');
  await expect(chinese).toHaveAttribute('lang', 'zh-Hant');
  await expect(chinese.locator('svg path[fill="#de2910"]')).toHaveCount(1);
  await expect(chinese.locator('svg g[fill="#ffde00"] > path')).toHaveCount(5);
  await expect(page.locator('[data-language-selector] svg path[fill="#de2910"]')).toHaveCount(1);
  await expect(page.locator('[data-language-selector]')).toContainText('繁中');
  await page.locator('.language-control').screenshot({
    path: test.info().outputPath('chinese-flag-trigger.png'),
  });
  await page.locator('.language-panel').screenshot({
    path: test.info().outputPath('language-menu.png'),
  });
  await chinese.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitemradio', { name: 'Русский', exact: true })).toBeFocused();
});

test('localized runtime preserves verbatim and form values and publishes alternates', async ({
  page,
}) => {
  await page.goto('./ru/developers/api');
  await expect(page.locator('.stage-code-window pre')).toContainText(
    'https://api.apcosys.net/api/v1/search/hosts',
  );
  await expect(page.locator('.locale-text .locale-text')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
  await expect(page.locator('link[rel="alternate"][hreflang="zh-Hant"]')).toHaveAttribute(
    'href',
    /\/zh-hant\/developers\/api\/$/,
  );

  await page.goto('./ru/');
  const input = page.locator('.search-preview [name="search_value"]');
  await input.fill('example.com  --  443');
  await expect(input).toHaveValue('example.com  --  443');
});

for (const locale of ['ru', 'zh-Hant'] as const) {
  const prefix = locale === 'ru' ? 'ru' : 'zh-hant';
  test(`${locale} corporate and legal editions have matching static metadata and navigation`, async ({
    page,
    request,
  }) => {
    for (const route of ['/about', '/responsible-scanning', '/legal/privacy-policy'] as const) {
      const response = await request.get('./' + prefix + route + '/');
      expect(response.ok()).toBe(true);
      const html = await response.text();
      expect(await staticDocumentLanguage(page, html)).toBe(locale);
      const title =
        formatTypography(translated(locale, localizedMetadata[route].title), locale) + ' | Apcosys';
      expect(html).toContain('<title>' + escapeHtml(title) + '</title>');
    }

    await page.goto('./' + prefix + '/pricing');
    const aboutLink = page
      .getByRole('navigation', { name: translated(locale, 'Footer'), exact: true })
      .getByRole('link', { name: translated(locale, 'About'), exact: true });
    await expect(aboutLink).toBeVisible();
    await expect(aboutLink).toHaveAttribute('href', new RegExp('/' + prefix + '/about$'));
    await aboutLink.click();
    await expect(page).toHaveURL(new RegExp('/' + prefix + '/about/?$'));
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      formatTypography(
        translated(locale, 'Built for people who investigate the internet.'),
        locale,
      ),
    );
  });
}

test('a missing route canonically identifies itself instead of the homepage', async ({ page }) => {
  await page.goto('./ru/missing-route');
  await expect(page.locator('main')).toHaveAttribute('data-route', '/404');
  const url = new URL(page.url());
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    url.origin + url.pathname,
  );
});

for (const width of [390, 1440]) {
  for (const [route, anchor] of [
    ['', 'api'],
    ['platform/search-investigation', 'search-syntax'],
    ['pricing', 'compare-plans'],
    ['docs/investors', 'investor-platform'],
    ['developers/api/docs', 'errors'],
    ['legal/terms', 'governing-law'],
  ] as const) {
    test(`language round trip keeps the visible anchor: ${route || 'home'} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`./${route}?source=language#${anchor}`);
      for (const [language, label] of [
        ['ru', 'Русский'],
        ['zh-Hant', '繁體中文'],
        ['en', 'English'],
      ] as const) {
        await expect(page.locator(`[id="${anchor}"]`)).toBeInViewport();
        await openLanguageMenu(page);
        await page.getByRole('menuitemradio', { name: label, exact: true }).click();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator(`[id="${anchor}"]`)).toBeInViewport();
        await page.evaluate(() => document.fonts.ready);
        const destination = new URL(page.url());
        expect(destination.search).toBe('?source=language');
        expect(destination.hash).toBe(`#${anchor}`);
        await expect
          .poll(() =>
            page
              .locator(`[id="${anchor}"]`)
              .evaluate((element) => element.getBoundingClientRect().top),
          )
          .toBeGreaterThanOrEqual(-1);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        ).toBeLessThanOrEqual(1);
      }
    });
  }
}
