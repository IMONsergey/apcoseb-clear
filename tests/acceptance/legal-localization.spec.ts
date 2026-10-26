import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { marked } from 'marked';
import { legalRoutes } from '../../src/content/legal-routes';
import type { LegalDocuments } from '../../src/content/legal-types';
import ru from '../../src/i18n/translations/ru';
import zhHant from '../../src/i18n/translations/zh-Hant';
import { formatTypography } from '../../src/i18n/typography';
import { openLanguageMenu } from '../helpers/locale';

const catalogs: Record<string, Record<string, string>> = { ru, 'zh-Hant': zhHant };
const englishDocuments = JSON.parse(
  readFileSync('src/content/legal-documents.json', 'utf8'),
) as LegalDocuments;
const withoutDiscretionaryBreaks = (value: string | null) => value?.replaceAll('\u00ad', '') ?? '';

for (const locale of ['ru', 'zh-Hant'] as const) {
  const prefix = locale === 'ru' ? 'ru' : 'zh-hant';
  const t = (source: string) => formatTypography(catalogs[locale]![source] ?? source, locale);

  for (const route of legalRoutes) {
    test(`${locale} ${route.path}: full translated text and stable anchors`, async ({ page }) => {
      const slug = route.path.split('/').pop();
      const source = await readFile(`docs/legal-translations/${locale}/${slug}.md`, 'utf8');
      await page.goto('./' + prefix + route.path);
      await expect
        .poll(async () =>
          withoutDiscretionaryBreaks(await page.getByRole('heading', { level: 1 }).textContent()),
        )
        .toBe(t(route.title));
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('.legal-copy')).toBeVisible();
      const expected = await page.evaluate(
        (html) => {
          const source = document.createElement('div');
          source.innerHTML = html;
          source.querySelector('h1')!.remove();
          source.querySelector('p')!.remove();
          return source.textContent!.replace(/\s+/g, ' ').trim();
        },
        await marked.parse(source),
      );
      expect((await page.locator('.legal-copy').textContent())!.replace(/\s+/g, ' ').trim()).toBe(
        expected,
      );

      const original = englishDocuments[route.path]!;
      expect(
        await page
          .locator('.legal-copy :is(h2, h3)')
          .evaluateAll((nodes) => nodes.map((node) => node.id)),
      ).toEqual(original.headings.map(({ id }) => id));
      await expect(page.locator('.legal-updated time')).toHaveAttribute(
        'datetime',
        original.updatedISO,
      );
      await expect(page.locator('.legal-updated time')).toHaveText(
        new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
          new Date(original.updatedISO + 'T00:00:00Z'),
        ),
      );
      await expect(page.locator('.legal-translation')).toHaveCount(0);
      const navigation = page.getByRole('navigation', { name: t('Legal documents'), exact: true });
      await expect(navigation.getByRole('link')).toHaveCount(6);
      await expect
        .poll(async () =>
          withoutDiscretionaryBreaks(
            await navigation.locator('[aria-current="page"]').textContent(),
          ),
        )
        .toBe(t(route.title));
      for (const href of await page
        .locator('.legal-copy a[href*="/legal/"]')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).pathname))) {
        expect(href).toMatch(new RegExp('/' + prefix + '/legal/'));
      }
      const last = page
        .getByRole('navigation', { name: t('On this page'), exact: true })
        .getByRole('link')
        .last();
      const hash = (await last.getAttribute('href'))!;
      await last.click();
      await expect(page.locator('[id="' + hash.slice(1) + '"]')).toBeInViewport();
      await page.reload();
      await expect(page.locator('[id="' + hash.slice(1) + '"]')).toBeInViewport();
    });
  }

  test(`${locale} legal language switching preserves the selected clause and query`, async ({
    page,
  }) => {
    await page.goto('./legal/terms?source=locale#governing-law');
    await expect(page.locator('#governing-law')).toBeInViewport();
    await openLanguageMenu(page);
    await page
      .getByRole('menuitemradio', {
        name: locale === 'ru' ? 'Русский' : '繁體中文',
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(
      new RegExp('/' + prefix + '/legal/terms/?\\?source=locale#governing-law$'),
    );
    await expect(page.locator('#governing-law')).toBeInViewport();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
  });

  test(`${locale} scanning request drafts use the selected language`, async ({ page }) => {
    await page.goto('./' + prefix + '/responsible-scanning');
    const request = page.locator('#scanning-opt-out a[href^="mailto:"]');
    const href = await request.getAttribute('href');
    expect(href).toBeTruthy();
    const email = new URL(href!);
    expect(email.searchParams.get('subject')).toBe(t('Apcosys network exclusion request'));
    expect(email.searchParams.get('body')).toContain(t('Networks / IP ranges:'));
    expect(email.searchParams.get('body')).toContain(t('My role in managing these networks:'));
  });

  test(`${locale} translated legal text stays readable when printed from dark mode`, async ({
    page,
  }) => {
    await page.goto('./' + prefix + '/legal/privacy-policy');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.legal-copy')).toBeVisible();
    await expect(page.locator('.legal-translation')).toHaveCount(0);
    await expect(page.locator('.legal-page')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('.legal-copy')).toHaveCSS('color', 'rgb(34, 34, 34)');
  });
}

for (const width of [320, 390]) {
  test(`Russian privacy title, navigation and print controls stay inside the ${width}px content rail`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./ru/legal/privacy-policy');
    await expect(page.locator('.legal-copy')).toBeVisible();
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const geometry = await page.evaluate(() => {
        const rail = document.querySelector('.legal-page > .container')!.getBoundingClientRect();
        const elements = Array.from(
          document.querySelectorAll(
            '.legal-header, .legal-header__copy, .legal-header h1, .legal-tools, .legal-tools button, .legal-documents a',
          ),
        );
        return {
          rail: { left: rail.left, right: rail.right },
          boxes: elements.flatMap((element) => {
            const box = element.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(element);
            return [box, ...Array.from(range.getClientRects())].map((bounds) => ({
              label: element.tagName + '.' + element.className,
              left: bounds.left,
              right: bounds.right,
            }));
          }),
        };
      });
      for (const box of geometry.boxes) {
        expect(box.left, theme + ' ' + box.label).toBeGreaterThanOrEqual(geometry.rail.left - 1);
        expect(box.right, theme + ' ' + box.label).toBeLessThanOrEqual(geometry.rail.right + 1);
      }
    }
    expect(await page.title()).not.toContain('\u00ad');
    expect(await page.locator('meta[name="description"]').getAttribute('content')).not.toContain(
      '\u00ad',
    );
    expect(await page.locator('.legal-copy').textContent()).not.toContain('\u00ad');
  });
}
