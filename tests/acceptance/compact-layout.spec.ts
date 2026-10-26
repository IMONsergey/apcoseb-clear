import { expect, test, type Page } from '@playwright/test';

async function expectStyledCapabilityPanels(page: Page) {
  const tabs = page.locator('.home-capabilities__tabs button');
  await tabs.nth(0).click();
  const query = page.locator('.home-capabilities .query-fragment');
  await expect(query).toBeVisible();
  await expect(query.getByRole('button')).toHaveCount(3);
  const search = await query.evaluate((panel) => {
    const frame = panel.getBoundingClientRect();
    const input = panel.querySelector('.query-fragment__input')!.getBoundingClientRect();
    const style = getComputedStyle(panel);
    return {
      framed: parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none',
      insets: [input.left - frame.left, frame.right - input.right],
      input: { left: input.left, right: input.right },
      rows: Array.from(panel.querySelectorAll('button'), (button) => {
        const box = button.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          top: box.top,
          bottom: box.bottom,
          height: box.height,
          textSizes: Array.from(button.querySelectorAll('span, code'), (text) =>
            parseFloat(getComputedStyle(text).fontSize),
          ),
        };
      }),
    };
  });
  expect(search.framed, 'Search remains a visibly framed workspace').toBe(true);
  expect(
    Math.min(...search.insets),
    'Search content has space inside its panel',
  ).toBeGreaterThanOrEqual(12);
  for (const [index, row] of search.rows.entries()) {
    expect(row.height, 'Each query choice is a full touch target').toBeGreaterThanOrEqual(44);
    expect(Math.min(...row.textSizes), 'Query choices remain readable').toBeGreaterThanOrEqual(14);
    expect(Math.abs(row.left - search.input.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(row.right - search.input.right)).toBeLessThanOrEqual(1);
    if (index > 0)
      expect(row.top, 'Query choices form separate vertical rows').toBeGreaterThanOrEqual(
        search.rows[index - 1]!.bottom - 1,
      );
  }

  await tabs.nth(2).click();
  const host = page.locator('.home-capabilities .host-fragment');
  await expect(host).toBeVisible();
  await expect(host.locator('.host-fragment__facts > div')).toHaveCount(3);
  const record = await host.evaluate((panel) => {
    const facts = Array.from(panel.querySelectorAll('.host-fragment__facts > div'), (fact) => {
      const box = fact.getBoundingClientRect();
      return { top: box.top, left: box.left, right: box.right };
    });
    const response = panel.querySelector('pre')!;
    const style = getComputedStyle(response);
    return {
      facts,
      responseSurface:
        style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)',
      responseInset: Math.min(parseFloat(style.paddingTop), parseFloat(style.paddingLeft)),
    };
  });
  const tops = record.facts.map((fact) => fact.top);
  expect(Math.max(...tops) - Math.min(...tops), 'Host facts remain in one row').toBeLessThanOrEqual(
    1,
  );
  for (let index = 1; index < record.facts.length; index++)
    expect(record.facts[index]!.left).toBeGreaterThan(record.facts[index - 1]!.right);
  expect(record.responseSurface, 'The service response has its own readable surface').toBe(true);
  expect(
    record.responseInset,
    'The service response has internal reading space',
  ).toBeGreaterThanOrEqual(8);
  await expect(host.locator('pre')).toContainText('HTTP/1.1 200 OK');

  await tabs.nth(0).click();
  await expect(query).toBeVisible();
}

for (const width of [390, 1440, 1920]) {
  test(`compact home composition at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('./');
    const results = page.locator('.search-scene__results');
    const box = await results.boundingBox();
    expect(box!.height).toBeLessThan(width < 600 ? 460 : 300);
    const hostnames = await results
      .locator('.product-evidence__result-main small')
      .evaluateAll((names) =>
        names.map((name) => {
          const range = document.createRange();
          range.selectNodeContents(name);
          return {
            height: range.getBoundingClientRect().height,
            lineHeight: parseFloat(getComputedStyle(name).lineHeight),
          };
        }),
      );
    for (const hostname of hostnames)
      expect(hostname.height, 'Example hostnames keep their domain suffix intact').toBeLessThan(
        hostname.lineHeight * 1.5,
      );
    await expect(page.locator('main .eyebrow')).toHaveCount(0);
    await expect(page.locator('.home-searchable .product-evidence')).toHaveCount(0);
    await expect(page.locator('.home-capabilities .product-evidence')).toHaveCount(0);
    const sceneTops = await page
      .locator('.step-illustration')
      .evaluateAll((scenes) => scenes.map((scene) => scene.getBoundingClientRect().top));
    expect(sceneTops).toHaveLength(5);
    expect(Math.max(...sceneTops) - Math.min(...sceneTops)).toBeLessThanOrEqual(1);
    const canvases = await page.locator('.step-illustration').evaluateAll((scenes) =>
      scenes.map((scene) => {
        const rect = scene.getBoundingClientRect();
        const card = scene.closest('.step-card')!;
        const cardBounds = card.getBoundingClientRect();
        const copyBounds = card.querySelector('.step-copy h3')!.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          copyLeft: copyBounds.left,
          cardLeft: cardBounds.left,
          cardWidth: cardBounds.width,
        };
      }),
    );
    for (const canvas of canvases) {
      expect(canvas.height, 'Compact excerpts reserve a readable canvas').toBeGreaterThanOrEqual(
        300,
      );
      expect(canvas.height).toBeLessThanOrEqual(360);
      expect(Math.abs(canvas.height - canvases[0]!.height)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(canvas.left - canvas.copyLeft),
        'each application screen starts at the same left edge as its step title',
      ).toBeLessThanOrEqual(1);
      expect(canvas.left, 'the card never clips the start of a screen').toBeGreaterThanOrEqual(
        canvas.cardLeft,
      );
      expect(
        canvas.left + canvas.width,
        'the complete application screen fits inside its card',
      ).toBeLessThanOrEqual(canvas.cardLeft + canvas.cardWidth);
    }
    await expect(page.locator('.application-toolbar')).toHaveCount(0);
    await expect(
      page.locator('[data-scene="query"] img[src$="/application/aperture.svg"]'),
    ).toHaveCount(0);
    await expect(page.locator('.home-searchable .double-button')).toHaveAttribute(
      'href',
      /data-methodology/,
    );
    const cards = page.locator('.home-usecases__grid article');
    await expect(cards).toHaveCount(3);
    if (width >= 768) {
      const boxes = await cards.evaluateAll((es) => es.map((e) => e.getBoundingClientRect().top));
      expect(Math.max(...boxes) - Math.min(...boxes)).toBeLessThan(1);
    }
    const images = page.locator('.home-usecases__grid img');
    await images.first().scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        images.evaluateAll((es: HTMLImageElement[]) =>
          es.every((e) => e.complete && e.naturalWidth > 0),
        ),
      )
      .toBe(true);
    await expectStyledCapabilityPanels(page);
    const buttons = page.locator('#plan-business .plan-button');
    await expect(buttons).toHaveCount(2);
    const a = await buttons.first().boundingBox(),
      b = await buttons.last().boundingBox();
    expect(Math.abs(a!.y - b!.y)).toBeLessThan(1);
    expect(b!.x).toBeGreaterThan(a!.x);
    const gap = await page.evaluate(() => {
      const c = document.querySelector('.home-team-cta')!.getBoundingClientRect();
      const next = document.querySelector('.lower-scene')!.getBoundingClientRect();
      return next.top - c.bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(63);
    if (width === 390) {
      await page.goto('./ru/');
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      for (const [name, selector] of [
        ['search-demo', '.search-scene__content'],
        ['query-options', '.home-capabilities .query-fragment'],
      ]) {
        const fragment = page.locator(selector!);
        await fragment.scrollIntoViewIfNeeded();
        const path = testInfo.outputPath(`${name}-ru-390.png`);
        await fragment.screenshot({ path, animations: 'disabled' });
        await testInfo.attach(`${name} ru at 390px`, { path, contentType: 'image/png' });
      }
    }
  });
}

test('internal pages use distinct compact visual narratives', async ({ page }) => {
  const routes = [
    ['teams', '.team-sequence'],
    ['use-cases/bug-bounty', '.scope-boundary'],
    ['use-cases/vulnerability-research', '.case-fragment--technology'],
    ['use-cases/osint-threat-investigation', '.indicator-trail'],
    ['platform/data-methodology', '.evidence-levels'],
    ['developers/api', '.stage-code-window'],
  ];
  for (const [route, selector] of routes) {
    await page.goto('./' + route);
    await expect(page.locator(selector!)).toBeVisible();
    await expect(page.locator('.application-scene')).toHaveCount(0);
    await expect(page.locator('main .eyebrow')).toHaveCount(0);
  }
});

test('data selectors are keyboard operable and section actions use the shared button', async ({
  page,
}) => {
  await page.goto('./');
  const domain = page.locator('.home-searchable__index button').nth(1);
  await domain.focus();
  await domain.press('Enter');
  await expect(domain).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.data-lens')).toHaveAttribute('aria-label', 'Domain records');
  await expect(page.locator('.data-lens .morph-panel__content .domain-tree')).toContainText(
    'example.com',
  );
  await expect(page.locator('#plan-business .plan-button--accent')).toContainText('Talk to Us');
  await expect(page.locator('.home-searchable .double-button--primary')).toBeVisible();
  await expect(page.locator('.step-evidence-note .double-button')).toBeVisible();
  await page.locator('.home-capabilities__tabs button').nth(3).click();
  await expect(
    page.locator('.home-capabilities__stage:visible .capability-record__host'),
  ).toHaveCount(2);
});
