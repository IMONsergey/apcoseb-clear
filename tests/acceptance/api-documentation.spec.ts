import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { wcagAxe } from '../helpers/accessibility';

const contract = JSON.parse(
  readFileSync(new URL('../../public/api/client.openapi.json', import.meta.url), 'utf8'),
) as {
  'x-apcosys-index-selection': {
    types: string[];
    type_aliases: Record<string, string>;
    ports_when: string;
  };
};
const indexSelection = contract['x-apcosys-index-selection'];

async function documentationTitle(page: Page) {
  return page.locator('.api-docs h1').evaluate((heading) => {
    const box = heading.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(heading);
    return {
      width: box.width,
      fontSize: parseFloat(getComputedStyle(heading).fontSize),
      clipped: [...range.getClientRects()]
        .filter(
          (rect) =>
            rect.width > 0 &&
            (rect.left < Math.max(0, box.left) - 1 ||
              rect.right > Math.min(innerWidth, box.right) + 1),
        )
        .map((rect) => ({ left: rect.left, right: rect.right })),
    };
  });
}

const documentedMethods = [
  ['POST', '/api/v1/search/hosts'],
  ['GET', '/api/v1/search/hosts/{host}'],
  ['POST', '/api/v1/search/analytics'],
  ['POST', '/api/v1/search/buckets'],
  ['POST', '/api/v1/search/buckets/analytics'],
  ['POST', '/api/v1/search/private/hosts'],
  ['GET', '/api/v1/search/private/hosts/{host}'],
  ['POST', '/api/v1/search/private/analytics'],
] as const;

test('API reference contains the eight published methods, schemas and error guidance', async ({
  page,
}) => {
  await page.goto('./developers/api/docs');
  await expect(page.locator('.api-docs h1')).toHaveText('API documentation.');
  await expect(page.locator('.stage-page-hero')).toHaveCount(0);
  const methods = page.locator('.api-docs__endpoint-list a');
  await expect(methods).toHaveCount(8);
  for (const [index, [method, path]] of documentedMethods.entries()) {
    await expect(methods.nth(index).locator('span').first()).toHaveText(method);
    await expect(methods.nth(index).locator('code')).toHaveText(path);
    const target = page.locator((await methods.nth(index).getAttribute('href'))!);
    await expect(target).toHaveCount(1);
    await expect(target).toContainText(path);
  }
  await expect(page.locator('#search-hosts')).toContainText(
    'zero or a value above 100 becomes 50; values 1–100 are kept',
  );
  await expect(page.locator('#search-hosts')).toContainText('uts descending');
  await expect(
    page.locator('#search-hosts tbody th').filter({ hasText: /^open_ports/ }),
  ).toHaveCount(1);
  await expect(page.locator('#search-buckets')).toContainText('Matching files across all pages.');
  await expect(page.locator('#bucket-analytics')).toContainText('can exceed result length');
  await expect(page.locator('#private-search')).toContainText('task_ids');
  await expect(page.locator('#private-search')).toContainText('Free is allowed');
  await expect(page.locator('#host-details')).toContainText('Public host absence is HTTP 500');
  await expect(page.locator('#private-search')).toContainText('404 host not found');
  const tls = page
    .locator('#host-details details')
    .filter({ has: page.locator('summary', { hasText: 'ports[].tls_info' }) });
  await tls.locator('summary').click();
  await expect(tls.locator('tbody th').filter({ hasText: /^sha256/ })).toBeVisible();
  await expect(tls.locator('tbody th').filter({ hasText: /certificate_info/ })).toHaveCount(0);
  await expect(page.locator('#errors tbody th')).toHaveText([
    '400',
    '401',
    '402',
    '404',
    '429',
    '500',
  ]);
  await expect(page.locator('#errors')).toContainText('unsupported search field');
  await expect(page.locator('.api-docs input, .api-docs textarea')).toHaveCount(0);
});

test('documentation copies a request without executing it and offers a selection fallback', async ({
  page,
}) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname === 'api.apcosys.net') apiRequests.push(request.url());
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as Window & { copiedCode?: string }).copiedCode = value;
        },
      },
    });
  });
  await page.goto('./developers/api/docs');
  const example = page.locator('[data-example="first-request"]');
  const code = await example.locator('pre').textContent();
  await example.getByRole('button', { name: 'Copy: First host search' }).click();
  await expect(example.getByRole('button')).toHaveText('Copied');
  expect(await page.evaluate(() => (window as Window & { copiedCode?: string }).copiedCode)).toBe(
    code,
  );
  expect(code).toContain('X-API-Key: $APCOSYS_API_KEY');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Clipboard unavailable');
        },
      },
    });
  });
  await example.getByRole('button').click();
  await expect(example.getByRole('button')).toHaveText('Selected');
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(code);
  await expect(example.getByRole('status')).toContainText('Code selected');
  expect(apiRequests).toEqual([]);
});

for (const locale of [
  { prefix: '', lang: 'en', title: 'API documentation.' },
  { prefix: 'ru/', lang: 'ru', title: 'Документация API.' },
  { prefix: 'zh-hant/', lang: 'zh-Hant', title: 'API 文件。' },
]) {
  test(`${locale.lang} API source metadata stays verbatim while UI remains localized`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 1000 });
    await page.goto(`./${locale.prefix}developers/api/docs#search-hosts`);
    await expect(page.locator('.api-docs h1')).toHaveText(locale.title);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.lang);
    await page.evaluate(() => document.fonts.ready);
    const disclosure = page.locator('#search-hosts details');
    await disclosure.locator('summary').click();
    const fieldRow = (name: string) =>
      disclosure.locator('tbody tr').filter({ has: page.getByText(name, { exact: true }) });
    for (const field of ['types', 'type_aliases'] as const) {
      const row = fieldRow(field);
      await expect(row).toHaveCount(1);
      const description = row.locator('td p');
      await expect(description).toBeVisible();
      await expect(description).toHaveAttribute('lang', 'en');
      expect(await description.textContent()).toBe(JSON.stringify(indexSelection[field]));
    }
    const portsWhen = fieldRow('ports_when').locator('td');
    expect(await portsWhen.locator('p').textContent()).toBe(indexSelection.ports_when);
    const overflow = await portsWhen.evaluate((cell) => ({
      cell: cell.scrollWidth - cell.clientWidth,
      document: document.documentElement.scrollWidth - innerWidth,
    }));
    expect(overflow.cell).toBeLessThanOrEqual(1);
    expect(overflow.document).toBeLessThanOrEqual(1);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale.lang} API documentation keeps readable tables and navigation in ${theme}`, async ({
      page,
    }, info) => {
      test.setTimeout(90_000);
      await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`./${locale.prefix}developers/api/docs`);
        await expect(page.locator('.api-docs h1')).toHaveText(locale.title);
        await expect(page.locator('html')).toHaveAttribute('lang', locale.lang);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('.api-docs__disclosure').evaluateAll((details) => {
          for (const item of details) (item as HTMLDetailsElement).open = true;
        });
        const geometry = await page.locator('.api-docs').evaluate((article) => {
          const header = article.querySelector('.api-docs__header')!.getBoundingClientRect();
          const layout = article.querySelector('.api-docs__layout')!.getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            aligned:
              Math.abs(header.left - layout.left) <= 1 &&
              Math.abs(header.right - layout.right) <= 1,
            cells: [...article.querySelectorAll('th,td')]
              .filter((cell) => !(innerWidth < 600 && cell.closest('.api-docs__fields thead')))
              .map((cell) => ({
                overflow: cell.scrollWidth - cell.clientWidth,
                size: parseFloat(getComputedStyle(cell).fontSize),
                header: Boolean(cell.closest('thead')),
              })),
            tableCodes: [...article.querySelectorAll('table code')].map((code) =>
              parseFloat(getComputedStyle(code).fontSize),
            ),
          };
        });
        expect(geometry.overflow, `${width}px`).toBeLessThanOrEqual(1);
        expect(geometry.aligned).toBe(true);
        const title = await documentationTitle(page);
        expect(title.clipped, `${locale.lang} ${width}px title`).toEqual([]);
        expect(title.fontSize).toBe(title.width <= 280 ? 32 : width <= 599 ? 40 : 48);
        if (width === 320) {
          for (const [model, css] of [
            ['overlay', 'html { scrollbar-width: none; scrollbar-gutter: auto; }'],
            [
              'classic',
              'html { scrollbar-width: auto; scrollbar-gutter: stable; overflow-y: scroll; } html::-webkit-scrollbar { width: 20px; }',
            ],
          ] as const) {
            const scrollbar = await page.addStyleTag({ content: css });
            const narrowTitle = await documentationTitle(page);
            expect(narrowTitle.clipped, `${locale.lang} ${theme} ${model} title`).toEqual([]);
            expect(narrowTitle.fontSize).toBe(narrowTitle.width <= 280 ? 32 : 40);
            await scrollbar.evaluate((element) => {
              element.parentNode?.removeChild(element);
            });
          }
        }
        for (const cell of geometry.cells) {
          expect(cell.overflow, `${locale.lang} ${width}px cell`).toBeLessThanOrEqual(1);
          expect(cell.size).toBeGreaterThanOrEqual(cell.header ? 14 : 16);
        }
        for (const size of geometry.tableCodes) expect(size).toBeGreaterThanOrEqual(14);
        if (width < 600) {
          await expect(
            page.locator('.api-docs__fields').first().getByRole('columnheader'),
          ).toHaveCount(2);
          const fields = page.locator('.api-docs__fields tbody tr');
          const rows = await fields.evaluateAll((elements) =>
            elements.map((row) => {
              const field = row.querySelector('th')!.getBoundingClientRect();
              const meaning = row.querySelector('td')!.getBoundingClientRect();
              return {
                left: Math.abs(field.left - meaning.left),
                gap: meaning.top - field.bottom,
                widths: Math.abs(field.width - meaning.width),
              };
            }),
          );
          for (const row of rows) {
            expect(row.left).toBeLessThanOrEqual(1);
            expect(row.widths).toBeLessThanOrEqual(1);
            expect(row.gap).toBeGreaterThanOrEqual(11);
          }
          const pageSize = page
            .locator('#search-hosts code')
            .filter({ hasText: /^docs_per_page$/ })
            .first();
          const dimensions = await pageSize.evaluate((element) => ({
            height: element.getBoundingClientRect().height,
            lineHeight: parseFloat(getComputedStyle(element).lineHeight),
          }));
          expect(dimensions.height).toBeLessThanOrEqual(dimensions.lineHeight + 1);
        }
        if (width <= 1000) {
          await expect(page.locator('.api-docs__sidebar')).toBeHidden();
          const menu = page.locator('.api-docs__mobile-nav');
          await menu.locator('summary').click();
          await expect(menu.locator('nav a')).toHaveCount(12);
          await menu.locator('a[href="#errors"]').click();
          await expect(menu).not.toHaveAttribute('open');
          await expect(page.locator('#errors')).toBeFocused();
          await expect(page.locator('#errors')).toBeInViewport();
        } else {
          const sidebar = page.locator('.api-docs__sidebar');
          await sidebar.locator('a[href="#filters"]').click();
          await expect(sidebar.locator('a[aria-current="location"]')).toHaveAttribute(
            'href',
            '#filters',
          );
          const bounds = await sidebar.boundingBox();
          const header = await page.locator('.site-header').boundingBox();
          expect(bounds!.y).toBeGreaterThanOrEqual(header!.height);
          expect(bounds!.y).toBeLessThan(header!.height + 48);
        }
        if (width === 320) {
          const result = await wcagAxe(page).analyze();
          expect(
            result.violations.map(({ id, nodes }) => ({
              id,
              targets: nodes.map((node) => node.target),
            })),
          ).toEqual([]);
        }
        if ((locale.lang === 'en' && width === 1440) || (locale.lang === 'ru' && width === 320)) {
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
          const path = info.outputPath(`api-documentation-${locale.lang}-${theme}-${width}.png`);
          await page.screenshot({ path, animations: 'disabled' });
          await info.attach(`API documentation ${locale.lang} ${theme} ${width}px`, {
            path,
            contentType: 'image/png',
          });
        }
      }
    });
  }
}

test('API document exposes artifact version, source and a base-safe JSON link in every locale', async ({
  page,
}) => {
  for (const prefix of ['', 'ru/', 'zh-hant/']) {
    await page.goto('./' + prefix + 'developers/api/docs');
    await expect(page.locator('[data-document-version]')).toContainText('OpenAPI 3.1.1');
    await expect(page.locator('.api-docs__header')).toContainText('CLIENT_API_DOCS_EN.md');
    const link = page.locator('.api-docs__header a[href$="/api/client.openapi.json"]');
    await expect(link).toHaveCount(1);
    const href = await link.getAttribute('href');
    expect(href).not.toContain('/ru/api/');
    expect(href).not.toContain('/zh-hant/api/');
    const response = await page.request.get(href!);
    expect(response.ok()).toBe(true);
    const json = await response.json();
    expect(json.openapi).toBe('3.1.1');
    await expect(page.locator('[data-document-version]')).toHaveAttribute(
      'data-document-version',
      json.info.version,
    );
  }
});

test('API canonical operation aliases and legacy section anchors retain query context', async ({
  page,
}) => {
  for (const anchor of [
    'host-details',
    'get-host',
    'analytics',
    'host-analytics',
    'private-search',
    'private-hosts',
    'get-private-host',
    'private-analytics',
  ]) {
    await page.goto('./developers/api/docs?reference=public#' + anchor);
    await expect(page.locator('#' + anchor)).toBeInViewport();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get('reference') === 'public' && url.hash === '#' + anchor,
    );
  }
});

test('API metadata preserves source uncertainty and whole-query type selection', async ({
  page,
}) => {
  await page.goto('./developers/api/docs#search-hosts');
  const disclosure = page.locator('#search-hosts details');
  await disclosure.locator('summary').click();
  await expect(disclosure).toContainText('Several type leaves search several catalogues.');
  await expect(disclosure).toContainText('all three catalogues');
  await expect(disclosure).toContainText('"domains":"domain"');
  await expect(disclosure).toContainText('query_moves_as_a_whole');
  await expect(page.locator('#filters')).toContainText(
    'conflicts with the documented empty named-header existence match',
  );
  await expect(page.locator('#access-limits')).toContainText('100 tokens per second, burst 10');
  await expect(page.locator('#access-limits')).not.toContainText(
    'Method costs count against the HTTP rate allowance',
  );
});
