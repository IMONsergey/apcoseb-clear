import { expect, test } from '@playwright/test';

test('Hero keeps one real search and immediately visible connected examples', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.hero .search-form')).toHaveCount(0);
  await expect(page.locator('.search-preview .search-form')).toHaveCount(1);
  const preview = page.locator('.search-scene__results');
  await expect(preview).toBeVisible();
  await expect(preview.locator('.product-evidence__details')).toContainText('nginx 1.24.0');
  await page.getByRole('button', { name: 'Technology', exact: true }).click();
  await expect(preview.locator('.product-evidence__query')).toContainText('nginx 1.24.0');
  await expect(preview.locator('.product-evidence__cve')).toBeVisible();
  await page.getByRole('button', { name: 'IP address', exact: true }).click();
  await expect(preview.locator('.product-evidence__result')).toHaveCount(1);
});

test('investigation results, selected host and context share one UI fragment', async ({ page }) => {
  await page.goto('./platform/search-investigation');
  const steps = page.locator('.stage-workbench__step');
  await expect(steps).toHaveCount(5);
  await steps.nth(1).click();
  const results = page.locator('.stage-workbench .product-evidence');
  await expect(results).toBeVisible();
  await expect(results.locator('.product-evidence__result')).toHaveCount(2);
  await results.locator('.product-evidence__result').nth(1).click();
  await expect(results.locator('.product-evidence__details h3')).toContainText('203.0.113.42');
  await steps.nth(3).click();
  await expect(page.locator('.stage-workbench .product-evidence__cve')).toBeVisible();
  await expect(results.locator('.product-evidence__details h3')).toContainText('203.0.113.42');
  await expect(page.locator('.stage-workbench')).toContainText('No CVE is asserted');
});

test('Monitoring has five meaningful concept states and selectable example assets', async ({
  page,
}) => {
  await page.goto('./platform/monitoring');
  const steps = page.locator('.stage-monitor-console__nav');
  await expect(steps).toHaveCount(5);
  await expect(page.locator('.stage-monitor-assets__list button')).toHaveCount(2);
  await page.locator('.stage-monitor-assets__list button').nth(1).click();
  await expect(page.locator('.stage-monitor-assets__details')).toContainText('203.0.113.42');
  await steps.nth(1).click();
  await expect(page.locator('.stage-monitor-console__summary')).toContainText(
    '443 / HTTPS + 22 / SSH',
  );
  await steps.nth(4).click();
  await expect(page.locator('.stage-monitor-console__link')).toHaveAttribute(
    'href',
    /search-investigation/,
  );
  await expect(page.locator('.stage-monitor-console')).toContainText('NO LIVE ALERTS');
});

for (const [route, label] of [
  ['/use-cases/bug-bounty', 'Search your scope'],
  ['/use-cases/vulnerability-research', 'Search by technology'],
  ['/use-cases/osint-threat-investigation', 'Look up an IP or domain'],
] as const) {
  test(`Use Case ${route} demonstrates the investigation and contextual CTA`, async ({ page }) => {
    await page.goto('.' + route);
    const journey = page.locator('.stage-example-journey');
    await expect(journey.locator(':scope > div')).toHaveCount(4);
    for (const step of ['Starting point', 'Query', 'Result', 'Next step']) {
      await expect(journey).toContainText(step);
    }
    await expect(page.locator('.stage-case-evidence .case-fragment')).toBeVisible();
    await expect(page.getByRole('link', { name: label }).first()).toHaveAttribute(
      'href',
      /\/search$/,
    );
  });
}

test('Pricing explains units before comparison without changing the original cards', async ({
  page,
}) => {
  await page.goto('./pricing');
  for (const plan of ['free', 'plus', 'expert', 'business']) {
    await expect(page.locator('#plan-' + plan)).toBeVisible();
  }
  await expect(page.locator('.stage-usage-guide')).toContainText('Search Tokens');
  await expect(page.locator('.stage-usage-guide')).toContainText('not yet verified');
  const sequence = await page.evaluate(() => {
    const guide = document.querySelector('.stage-usage-guide');
    const compare = document.querySelector('#compare-plans');
    return Boolean(
      guide && compare && guide.compareDocumentPosition(compare) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  expect(sequence).toBe(true);
  await expect(page.locator('#search-token-packages')).toContainText('25,000');
});

test('API starts with request, supports response and discloses unverified auth', async ({
  page,
}) => {
  await page.goto('./developers/api');
  const code = page.locator('.stage-code-window');
  await expect(code.locator('pre')).toContainText('APCOSYS_API_ENDPOINT');
  await expect(code.locator('.stage-api-auth')).toContainText('AUTHENTICATION');
  await expect(code.getByRole('button', { name: 'Response', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await code.getByRole('button', { name: 'Response', exact: true }).click();
  await expect(code.locator('pre')).toContainText('Illustrative response shape only');
});
