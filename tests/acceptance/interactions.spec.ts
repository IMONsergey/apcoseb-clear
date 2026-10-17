import { expect, test } from '@playwright/test';

test('Homepage preserves one real search input inside the original SearchPreview', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await expect(page.locator('.hero .search-form')).toHaveCount(0);
  await expect(page.locator('.search-preview .search-form')).toHaveCount(1);
  await expect(page.locator('.search-preview .stage-preview-query')).toHaveCount(0);
  await expect(page.locator('.stage-query-examples')).toHaveCount(0);
  await expect(page.locator('.stage-section')).toHaveCount(0);
  const input = page.locator('.search-preview [name="search_value"]');
  await input.fill('example.com');
  await expect(input).toHaveValue('example.com');
  await expect(page.locator('.search-preview .search-form')).toHaveAttribute('action', /\/search$/);
});

for (const height of [768, 900, 1080]) {
  test(
    'Hero CTA remains visible in the first desktop fold at height ' + height,
    async ({ page }) => {
      await page.setViewportSize({ width: 1440, height });
      await page.goto('./');
      await expect(page.locator('.hero h1')).toBeVisible();
      const primary = page.locator('.hero .double-button').first();
      const rect = await primary.boundingBox();
      expect(rect).not.toBeNull();
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(height + 2);
    },
  );
}

for (const width of [320, 390, 1366, 1440, 1920]) {
  test('layout has no horizontal overflow at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./pricing');
    await expect(page.locator('.stage-plan-table')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width + 2,
    );
    const table = page.locator('.stage-table-scroll').last();
    if (width < 800) {
      const sizes = await table.evaluate((el) => ({
        content: el.scrollWidth,
        viewport: el.clientWidth,
      }));
      expect(sizes.content).toBeGreaterThan(sizes.viewport);
      await table.evaluate((el) => (el.scrollLeft = 9999));
      expect(await table.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    }
  });
}

test('five-step investigation workbench moves through contextual scenes', async ({ page }) => {
  await page.goto('./platform/search-investigation');
  const tabs = page.locator('.stage-workbench__step');
  await expect(tabs).toHaveCount(5);
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.stage-workbench__insight h3')).toContainText('Examine a host');
  await tabs.nth(4).click();
  await expect(page.locator('.stage-workbench__insight h3')).toContainText('Refine');
});

test('monitoring concept changes state and does not claim real alerts', async ({ page }) => {
  await page.goto('./platform/monitoring');
  await expect(
    page.getByText('Concept demonstration · Not a live product capability'),
  ).toBeVisible();
  const buttons = page.locator('.stage-monitor-console__nav');
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('443 / HTTPS + 80 / HTTP')).toBeVisible();
  await buttons.nth(2).click();
  await expect(page.getByRole('heading', { name: 'Review a possible change.' })).toBeVisible();
  await expect(page.getByText('NO LIVE ALERTS')).toBeVisible();
});

test('distinct use-case evidence is accessible in each research journey', async ({ page }) => {
  await page.goto('./use-cases/bug-bounty');
  await expect(page.getByRole('heading', { name: 'Visibility isn’t permission.' })).toBeVisible();
  await page.goto('./use-cases/vulnerability-research');
  await expect(page.getByRole('heading', { name: /A version is a lead/ })).toBeVisible();
  await page.goto('./use-cases/osint-threat-investigation');
  await expect(page.getByRole('heading', { name: /Follow attributes/ })).toBeVisible();
});

test('pricing monthly and annual values follow documented discount', async ({ page }) => {
  await page.goto('./pricing');
  await expect(page.locator('#plan-plus .plan-price')).toContainText('$50');
  await expect(page.locator('#plan-expert .plan-price')).toContainText('$300');
  await expect(page.locator('#plan-business .plan-price')).toContainText('$900');
  await page.locator('.billing--desktop').getByRole('radio', { name: 'Annually' }).check();
  await expect(page.locator('#plan-plus .plan-price')).toContainText('$40');
  await expect(page.locator('#plan-expert .plan-price')).toContainText('$240');
  await expect(page.locator('#plan-business .plan-price')).toContainText('$720');
  await expect(page.locator('#plan-plus .plan-billing-note')).toContainText('$480');
  await expect(page.locator('#plan-expert .plan-billing-note')).toContainText('$2,880');
  await expect(page.locator('#plan-business .plan-billing-note')).toContainText('$8,640');
  await page.getByRole('button', { name: 'Choose Business' }).click();
  const dialog = page.getByRole('dialog', { name: 'BUSINESS plan' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('selection is not transferred');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('#plan-business .stage-plan-contact')).toHaveAttribute(
    'href',
    /\/contact$/,
  );
});

test('API example is explicitly illustrative and request/response switch', async ({ page }) => {
  await page.goto('./developers/api');
  await expect(page.locator('.stage-code-window pre')).toContainText('APCOSYS_API_ENDPOINT');
  await page.getByRole('button', { name: 'Response', exact: true }).click();
  await expect(page.locator('.stage-code-window pre')).toContainText(
    'Illustrative response shape only',
  );
});

test('Homepage navigation reaches search syntax and respects history', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Platform', exact: true }).click();
  await page.getByRole('link', { name: 'Search & Investigation' }).first().click();
  await expect(page).toHaveURL(/\/platform\/search-investigation$/);
  await page.locator('#search-syntax').scrollIntoViewIfNeeded();
  await expect(page.locator('#search-syntax')).toBeInViewport();
  await page.goBack();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/');
  await page.goForward();
  await expect(page.locator('main')).toHaveAttribute(
    'data-route',
    '/platform/search-investigation',
  );
});

test('direct path refresh serves route-specific SEO meta in static response', async ({
  request,
  page,
}) => {
  const response = await request.get('./platform/data-methodology/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('Data &amp; Methodology');
  await page.goto('./platform/data-methodology');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Know what');
});

test('registration and Sign In never claim unsupported plan selection', async ({ page }) => {
  await page.goto('./pricing');
  await page.getByRole('button', { name: 'Choose Plus' }).click();
  await expect(page.getByRole('dialog', { name: 'PLUS plan' })).toContainText(
    'selection is not transferred',
  );
  await expect(page.locator('.site-header .header-signin')).toHaveAttribute(
    'href',
    'https://apcosys.net/',
  );
});

test('contact form displays required email fallback and validation', async ({ page }) => {
  await page.goto('./contact');
  await expect(page.getByRole('button', { name: 'Prepare email' })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare email' }).click();
  await expect(page.locator('[name="name"]')).toHaveAttribute('required', '');
  await expect(
    page.getByText('Messages are not stored or delivered by this website.', { exact: false }),
  ).toBeVisible();
});

test('direct hash entry waits for lazy investigation content', async ({ page }) => {
  await page.goto('./platform/search-investigation#search-syntax');
  await expect(page.locator('main')).toHaveAttribute(
    'data-route',
    '/platform/search-investigation',
  );
  await expect(page.locator('#search-syntax')).toBeInViewport();
});

test('browser history restores scroll after lazy route navigation', async ({ page }) => {
  await page.goto('./platform/data-methodology');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await expect
    .poll(() => page.evaluate(() => Number(history.state?.apcoScrollY) || 0))
    .toBeGreaterThan(600);
  const previousY = await page.evaluate(() => window.scrollY);

  await page.evaluate(() => {
    document.querySelector<HTMLAnchorElement>('.site-header a[href$="/pricing"]')?.click();
  });
  await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Choose the access');

  await page.goBack();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/platform/data-methodology');
  await expect
    .poll(() => page.evaluate((expected) => Math.abs(window.scrollY - expected), previousY))
    .toBeLessThan(80);
});

test('unverified API docs remain within the supported on-site guidance', async ({ page }) => {
  await page.goto('./');
  await page.getByText('Can I use the API?', { exact: true }).click();
  await page.locator('#faq').getByRole('link', { name: 'Read API integration guidance' }).click();
  await expect(page).toHaveURL(/\/developers\/api#documentation$/);
  await expect(page.locator('#documentation')).toBeInViewport();
  await page.getByRole('link', { name: 'Read API integration guidance' }).first().click();
  await expect(page).toHaveURL(/\/developers\/api#documentation$/);
  await expect(page.locator('#documentation')).toBeInViewport();
  await expect(
    page.getByText('Illustrative request template, not a working API contract.', { exact: false }),
  ).toBeVisible();
});

test('investigation page leads with one connected product scene, not another search widget', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./platform/search-investigation');
  await expect(page.locator('.stage-platform-search .search-form')).toHaveCount(0);
  await expect(page.locator('.stage-workbench__viewer')).toBeVisible();
  await expect(page.locator('.stage-workbench__step')).toHaveCount(5);
  await expect(page.locator('.stage-page-cta')).toHaveCount(0);
});
