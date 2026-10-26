import { expect, test, type Locator, type Page } from '@playwright/test';

async function ready(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator('main h1')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function expectTextWithinParent(locator: Locator, checkVertical = true) {
  const overflows = await locator.evaluateAll(
    (elements, vertical) =>
      elements.flatMap((element) => {
        const parent = element.parentElement!.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(element);
        const outside = [...range.getClientRects()].some(
          (rect) =>
            rect.width > 0 &&
            (rect.left < parent.left - 1 ||
              rect.right > parent.right + 1 ||
              (vertical && (rect.top < parent.top - 1 || rect.bottom > parent.bottom + 1))),
        );
        return outside ? [element.textContent] : [];
      }),
    checkVertical,
  );
  expect(overflows).toEqual([]);
}

async function showBillingDock(page: Page) {
  const range = await page.locator('.pricing-options').evaluate((element) => ({
    top: element.getBoundingClientRect().top + scrollY,
    height: element.clientHeight,
  }));
  for (let top = range.top - 400; top < range.top + range.height - 300; top += 90) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    if ((await page.locator('.billing-dock').getAttribute('data-visible')) === 'true') return;
  }
  throw new Error('The billing switch was unavailable throughout the pricing section.');
}

for (const locale of ['', 'ru/', 'zh-hant/']) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [320, 768, 1440]) {
      test(`search validation stays above example controls: ${locale || 'en'} ${theme} ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: theme });
        await ready(page, './' + locale);
        const input = page.locator('.search-form [name="search_value"]');
        await page.locator('.search-submit').click();
        const error = page.locator('.search-error');
        await expect(error).toBeVisible();
        await expect(input).toHaveAttribute('aria-invalid', 'true');
        await expect(input).toHaveAttribute('aria-describedby', (await error.getAttribute('id'))!);
        const formBox = (await page.locator('.search-form').boundingBox())!;
        const errorBox = (await error.boundingBox())!;
        const examplesBox = (await page.locator('.search-examples').boundingBox())!;
        expect(errorBox.y).toBeGreaterThanOrEqual(formBox.y + formBox.height + 8);
        expect(examplesBox.y).toBeGreaterThanOrEqual(errorBox.y + errorBox.height + 8);
        await expectTextWithinParent(error);
        await input.fill('example.com');
        await expect(error).toHaveCount(0);
        await expect(input).not.toHaveAttribute('aria-invalid', 'true');
        await expect(page.locator('.search-examples button')).toHaveCount(3);
      });
    }
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`Russian compact cards and billing remain readable at 320px in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await ready(page, './ru/');
    await expectTextWithinParent(page.locator('.metric-card > dt, .metric-card > dd'));
    await expectTextWithinParent(page.locator('.home-capabilities__copy h3'));
    await expectTextWithinParent(page.locator('.footer-columns a > .locale-text'));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);

    const brokenWords = await page.locator('.audience-copy h3').evaluateAll((headings) =>
      headings.flatMap((heading) => {
        const lineHeight = parseFloat(getComputedStyle(heading).lineHeight);
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const broken: string[] = [];
        let node;
        while ((node = walker.nextNode())) {
          for (const match of node.textContent!.matchAll(/\p{L}{6,}/gu)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            if (range.getBoundingClientRect().height > lineHeight * 1.5) broken.push(match[0]);
          }
        }
        return broken;
      }),
    );
    expect(brokenWords).toEqual([]);

    const contrasts = await page
      .locator('.home-usecases__story .double-button__label')
      .evaluateAll((tags) => {
        const luminance = (color: string) => {
          const rgb = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number);
          const linear = rgb.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
        };
        return tags.map((tag) => {
          const text = luminance(getComputedStyle(tag).color);
          const background = luminance(getComputedStyle(tag).backgroundColor);
          return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
        });
      });
    expect(contrasts).toHaveLength(3);
    for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5);

    await showBillingDock(page);
    const overlap = await page.locator('.billing-dock').evaluate((dock) => {
      const offer = dock.querySelector('.billing-dock__offer')!.getBoundingClientRect();
      const control = dock.querySelector('.billing-switch')!.getBoundingClientRect();
      return (
        Math.min(offer.right, control.right) - Math.max(offer.left, control.left) > 1 &&
        Math.min(offer.bottom, control.bottom) - Math.max(offer.top, control.top) > 1
      );
    });
    expect(overlap).toBe(false);
    await expectTextWithinParent(
      page.locator('.billing-dock__offer strong, .billing-dock__offer > span'),
    );
  });
}

test('Russian use-case conclusions retain full words and all verification stages', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await ready(page, './ru/use-cases/vulnerability-research');
    const path = page.locator('.case-fragment--technology .version-path');
    await expect(path.locator('span')).toHaveCount(3);
    await expectTextWithinParent(path.locator('span'));
    await expect(path).toContainText('Проверка');

    await ready(page, './ru/use-cases/osint-threat-investigation');
    const conclusion = page.locator('.stage-example-journey > div').last().locator('p');
    await expectTextWithinParent(conclusion);
    const brokenWords = await conclusion.evaluate((element) => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const broken: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        for (const match of node.textContent!.matchAll(/\p{L}{6,}/gu)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          if (range.getBoundingClientRect().height > lineHeight * 1.5) broken.push(match[0]);
        }
      }
      return broken;
    });
    expect(brokenWords).toEqual([]);
  }
});

test('Chinese team allowance keeps its number and multiplier together on a phone', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await ready(page, './zh-hant/teams');
    const values = page.locator('.business-allowance strong');
    // A font's glyph box may extend beyond line-height:1 without being clipped.
    // The regression concerns horizontal fit and a single line for the full value.
    await expectTextWithinParent(values, false);
    const middle = await values.nth(1).evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return {
        height: range.getBoundingClientRect().height,
        fontSize: parseFloat(getComputedStyle(element).fontSize),
      };
    });
    expect(middle.height).toBeLessThan(middle.fontSize * 1.6);
  }
});

test('Russian pricing uses translated filters, plural units and an early comparison hint', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await ready(page, './ru/pricing');
  const comparison = page.locator('.stage-plan-table');
  await expect(comparison).toContainText('Базовые');
  await expect(comparison).toContainText('Расширенные');
  await expect(comparison).toContainText('5 запросов/с');
  await expect(page.locator('.stage-token-grid')).toContainText('поисковых токенов');
  await expect(page.locator('.stage-token-grid > div').first()).toContainText('25 000');
  await expect(page.locator('.stage-token-grid > div').first()).toContainText('50 $');
  const hint = page.locator('#plan-comparison-hint');
  await expect(page.locator('#compare-plans .stage-table-scroll')).toHaveAttribute(
    'aria-describedby',
    'plan-comparison-hint',
  );
  expect((await hint.boundingBox())!.y).toBeLessThan((await comparison.boundingBox())!.y);
});

for (const locale of ['', 'ru/', 'zh-hant/']) {
  for (const theme of ['light', 'dark'] as const) {
    test(`plan comparison values stay visible beside pinned labels: ${locale || 'en'} ${theme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await ready(page, './' + locale + 'pricing');
        const scroll = page.locator('#compare-plans .stage-table-scroll');
        for (let column = 1; column <= 4; column++) {
          await scroll.evaluate((element, index) => {
            const headings = element.querySelectorAll('thead th');
            const label = headings[0]!.getBoundingClientRect();
            const plan = headings[index]!.getBoundingClientRect();
            element.scrollLeft += plan.left - label.right;
          }, column);
          const clipped = await scroll.evaluate((element, index) => {
            const viewport = element.getBoundingClientRect();
            return [...element.querySelectorAll('tr')].flatMap((row) => {
              const label = row.children[0]!.getBoundingClientRect();
              const cell = row.children[index]!;
              const range = document.createRange();
              range.selectNodeContents(cell);
              const outside = [...range.getClientRects()].some(
                (rect) =>
                  rect.width > 0 &&
                  (rect.left < label.right - 1 || rect.right > viewport.right + 1),
              );
              return outside ? [cell.textContent] : [];
            });
          }, column);
          expect(clipped, `${locale || 'en'} ${width}px plan column ${column}`).toEqual([]);
        }
      }
    });
  }
}

test('the homepage comparison offers a route to the complete feature table', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await ready(page, './');
  await page.locator('.comparison-action').getByRole('button', { name: 'Compare plans' }).click();
  const dialog = page.getByRole('dialog', { name: 'Compare plans' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link', { name: 'View all plan features' }).click();
  await expect(page).toHaveURL(/\/pricing#compare-plans$/);
  await expect(page.locator('.stage-plan-table')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
