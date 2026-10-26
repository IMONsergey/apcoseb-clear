import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

for (const width of [320, 768, 1440]) {
  test(`internal pages keep their hierarchy and illustration at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    for (const route of siteRoutes.filter(
      (route) => route.path !== '/' && route.group !== 'legal' && route.group !== 'documentation',
    )) {
      await page.goto('.' + route.path);
      const hero = page.locator('.stage-page-hero');
      await expect(hero.locator('h1')).toBeVisible();
      const illustration = hero.locator('img');
      await expect(illustration).toHaveCount(1);
      await expect(illustration).toHaveAttribute('alt', /\S/);
      await expect
        .poll(() => illustration.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        title: parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize),
        headings: [...document.querySelectorAll('.inner-pages h2')].map((heading) =>
          parseFloat(getComputedStyle(heading).fontSize),
        ),
      }));
      expect(layout.overflow, route.path).toBeLessThanOrEqual(1);
      expect(
        layout.headings.every((size) => size < layout.title),
        route.path,
      ).toBe(true);
    }
  });
}

test('all monitoring stages fit on desktop without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./platform/monitoring');
  const stages = page.locator('.stage-monitor-console__sidebar');
  await expect(stages.locator('button')).toHaveCount(5);
  expect(await stages.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await stages.scrollIntoViewIfNeeded();
  await expect(stages.locator('button').last()).toBeInViewport();
});

for (const locale of ['', 'ru/', 'zh-hant/']) {
  for (const theme of ['light', 'dark']) {
    test(`${locale || 'en'} scanner fields and API access keep readable aligned columns in ${theme}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(90_000);
      await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const route of ['responsible-scanning', 'developers/api']) {
          const context = `${locale}${route}, ${width}px, ${theme}`;
          await page.goto(`./${locale}${route}`);
          const pair = page.locator('.editorial-pair');
          await expect(pair).toBeVisible();
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          await page.evaluate(() => document.fonts.ready);
          if (
            (locale === '' && width === 1440 && theme === 'light') ||
            (locale === 'ru/' && width === 768 && theme === 'dark') ||
            (locale === 'zh-hant/' && width === 320 && theme === 'light')
          ) {
            const section = page.locator(
              route === 'responsible-scanning' ? '#scanner-identity' : '#api-access',
            );
            const height = Math.ceil((await section.boundingBox())!.height) + 200;
            await page.setViewportSize({ width, height: Math.max(1000, height) });
            await section.evaluate((element) =>
              window.scrollTo({
                top: element.getBoundingClientRect().top + scrollY - 100,
                behavior: 'instant',
              }),
            );
            const path = testInfo.outputPath(`${route.replaceAll('/', '-')}-${width}-${theme}.png`);
            await section.screenshot({ path, animations: 'disabled' });
            await testInfo.attach(`${route} ${width}px ${theme}`, {
              path,
              contentType: 'image/png',
            });
            await page.setViewportSize({ width, height: 1000 });
          }
          const columns = await pair.evaluate((element) =>
            [...element.children].map((column) => {
              const heading = column.querySelector('h3')!;
              const content = column.lastElementChild!;
              return {
                rows: getComputedStyle(column).gridTemplateRows,
                contain: getComputedStyle(column).contain,
                left: column.getBoundingClientRect().left,
                top: column.getBoundingClientRect().top,
                bottom: column.getBoundingClientRect().bottom,
                headingTop: heading.getBoundingClientRect().top,
                headingBottom: heading.getBoundingClientRect().bottom,
                contentTop: content.getBoundingClientRect().top,
                contentLeft: content.getBoundingClientRect().left,
              };
            }),
          );
          expect(columns, context).toHaveLength(2);
          for (const column of columns) {
            expect(Math.abs(column.contentLeft - column.left), context).toBeLessThanOrEqual(1);
            expect(column.contentTop - column.headingBottom, context).toBeGreaterThanOrEqual(23);
          }
          if (width >= (route === 'developers/api' ? 1001 : 768)) {
            expect(
              Math.abs(columns[0]!.headingTop - columns[1]!.headingTop),
              context,
            ).toBeLessThanOrEqual(1);
            expect(
              Math.abs(columns[0]!.contentTop - columns[1]!.contentTop),
              `${context}: ${JSON.stringify(columns)}`,
            ).toBeLessThanOrEqual(1);
          } else {
            expect(columns[1]!.top - columns[0]!.bottom, context).toBeGreaterThanOrEqual(31);
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
            context,
          ).toBeLessThanOrEqual(1);

          if (route === 'responsible-scanning') {
            const fields = await page.locator('.scanning-checklist > div').evaluateAll((rows) =>
              rows.map((row) => {
                const term = row.querySelector('dt')!;
                const definition = row.querySelector('dd')!;
                const termBox = term.getBoundingClientRect();
                const definitionBox = definition.getBoundingClientRect();
                return {
                  termLeft: termBox.left,
                  termRight: termBox.right,
                  termBottom: termBox.bottom,
                  definitionLeft: definitionBox.left,
                  definitionTop: definitionBox.top,
                  termOverflow: term.scrollWidth - term.clientWidth,
                  definitionOverflow: definition.scrollWidth - definition.clientWidth,
                  size: parseFloat(getComputedStyle(definition).fontSize),
                };
              }),
            );
            expect(fields, context).toHaveLength(4);
            const starts = fields.map((field) => field.definitionLeft);
            expect(Math.max(...starts) - Math.min(...starts), context).toBeLessThanOrEqual(1);
            for (const field of fields) {
              expect(field.size, context).toBeGreaterThanOrEqual(18);
              expect(field.termOverflow, context).toBeLessThanOrEqual(1);
              expect(field.definitionOverflow, context).toBeLessThanOrEqual(1);
              if (Math.abs(field.definitionLeft - field.termLeft) <= 1)
                expect(field.definitionTop - field.termBottom, context).toBeGreaterThanOrEqual(7);
              else
                expect(field.definitionLeft - field.termRight, context).toBeGreaterThanOrEqual(23);
            }
          } else {
            const table = page.locator('.stage-api-limits .stage-table-scroll');
            expect(
              await table.evaluate((el) => el.scrollWidth - el.clientWidth),
              context,
            ).toBeLessThanOrEqual(1);
            await expect(table.locator('thead th[scope="col"]')).toHaveCount(3);
            await expect(table.locator('tbody th[scope="row"]')).toHaveCount(4);
            const rates = await table.locator('tbody tr td:last-child').allTextContents();
            expect(rates[0], context).toBe('—');
            for (const [index, rate] of [1, 2, 5].entries())
              expect(rates[index + 1], context).toMatch(new RegExp(`(?:^|\\D)${rate}(?:\\D|$)`));
            const cells = await table.locator('th,td').evaluateAll((elements) =>
              elements.map((cell) => ({
                heading: Boolean(cell.closest('thead')),
                size: parseFloat(getComputedStyle(cell).fontSize),
                overflow: cell.scrollWidth - cell.clientWidth,
              })),
            );
            for (const cell of cells) {
              expect(cell.size, context).toBeGreaterThanOrEqual(cell.heading ? 14 : 16);
              expect(cell.overflow, context).toBeLessThanOrEqual(1);
            }
            const brokenWords = await table.locator('thead th').evaluateAll((headings) =>
              headings.flatMap((heading) => {
                const lineHeight = parseFloat(getComputedStyle(heading).lineHeight);
                const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
                const broken: string[] = [];
                let node;
                while ((node = walker.nextNode())) {
                  for (const match of node.textContent!.matchAll(/[A-Za-zА-Яа-яЁё]{6,}/gu)) {
                    const range = document.createRange();
                    range.setStart(node, match.index);
                    range.setEnd(node, match.index + match[0].length);
                    if (range.getBoundingClientRect().height > lineHeight * 1.5)
                      broken.push(match[0]);
                  }
                }
                return broken;
              }),
            );
            expect(brokenWords, context).toEqual([]);
          }
        }
      }
    });
  }
}
