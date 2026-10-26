import { expect, test } from '@playwright/test';
import { deploymentSettings } from '../helpers/public-settings';

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

for (const motion of ['reduce', 'no-preference'] as const) {
  test(`research carousel handles rapid input and viewport changes: ${motion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('./');
    const carousel = page.locator('#how-it-works');
    const track = carousel.locator('#research-track');
    const counter = carousel.locator('.counter');
    const previous = carousel.getByRole('button', { name: 'Previous research step' });
    const next = carousel.getByRole('button', { name: 'Next research step' });

    for (const width of [390, 1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await track.scrollIntoViewIfNeeded();
      await track.press('Home');
      const total = width === 390 ? 5 : 3;
      await expect(counter).toHaveText(`1 / ${total}`);
      await expect(previous).toBeDisabled();
      await next.click();
      await next.click();
      await expect(counter).toHaveText(`3 / ${total}`);
      await track.press('End');
      await expect(counter).toHaveText(`${total} / ${total}`);
      await expect(next).toBeDisabled();
      await expect(track.locator('.step-card').last()).toBeInViewport({ ratio: 0.98 });
      await track.press('ArrowLeft');
      await expect(counter).toHaveText(`${total - 1} / ${total}`);
      await expect(next).toBeEnabled();
    }
  });
}

test('three-step investigation workbench changes the active task with keyboard navigation', async ({
  page,
}) => {
  await page.goto('./platform/search-investigation');
  const tabs = page.locator('.stage-workbench__step');
  await expect(tabs).toHaveCount(3);
  await expect(page.locator('.investigation-query')).toBeVisible();
  await tabs.first().focus();
  await tabs.first().press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(page.locator('.investigation-results')).toBeVisible();
  await expect(page.locator('.investigation-query')).toHaveCount(0);
  await tabs.nth(1).press('End');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.investigation-host__heading')).toContainText('198.51.100.24');
  await tabs.nth(2).press('Home');
  await expect(tabs.first()).toBeFocused();
  await expect(page.locator('.investigation-query')).toBeVisible();
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
  await expect(page.locator('.stage-concept-label')).toBeVisible();
  await expect(page.locator('.stage-concept-label')).toContainText('Not a live product capability');
});

test('distinct use-case evidence is accessible in each research journey', async ({ page }) => {
  await page.goto('./use-cases/bug-bounty');
  await expect(
    page.getByRole('heading', { name: 'From a domain to an in-scope host.' }),
  ).toBeVisible();
  await page.goto('./use-cases/vulnerability-research');
  await expect(
    page.getByRole('heading', { name: 'From a product to the hosts running it.' }),
  ).toBeVisible();
  await page.goto('./use-cases/osint-threat-investigation');
  await expect(
    page.getByRole('heading', { name: 'From an IP address to its services.' }),
  ).toBeVisible();
});

test('homepage plan prices follow the selected billing period', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  await expect(page.locator('.billing--desktop input[value="annually"]')).toBeChecked();
  await expect(page.locator('.plan-grid .price-amount')).toHaveText(['$0', '$40', '$240', '$720']);
  await page.locator('.billing--desktop').getByRole('radio', { name: 'Monthly' }).check();
  await expect(page.locator('.plan-grid .price-amount')).toHaveText(['$0', '$50', '$300', '$900']);
  await page.locator('.billing--desktop').getByRole('radio', { name: 'Annually' }).check();
  await expect(page.locator('.plan-grid .price-amount')).toHaveText(['$0', '$40', '$240', '$720']);
  await expect(page.locator('#plan-plus .plan-billing-note')).toContainText('$480');
  await expect(page.locator('#plan-expert .plan-billing-note')).toContainText('$2,880');
  await expect(page.locator('#plan-business .plan-billing-note')).toContainText('$8,640');
});

test('billing switch aligns with the heading baseline on desktop', async ({ page }) => {
  for (const route of ['./', './pricing']) {
    for (const width of [1440, 1856]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await expect(page.locator('.pricing-heading')).toBeVisible();
      await expect(page.locator('.billing--desktop')).toBeVisible();
      await expect(page.locator('.plan-grid')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const bounds = await page.evaluate(() => {
        const heading = document.querySelector('.pricing-heading')!.getBoundingClientRect();
        const controls = document.querySelector('.billing--desktop')!.getBoundingClientRect();
        const cards = document.querySelector('.plan-grid')!.getBoundingClientRect();
        return {
          rightEdgeGap: Math.abs(controls.right - cards.right),
          bottomGap: Math.abs(controls.bottom - heading.bottom),
        };
      });
      expect(bounds.rightEdgeGap, `${route} billing right edge at ${width}px`).toBeLessThanOrEqual(
        2,
      );
      expect(bounds.bottomGap, `${route} billing baseline at ${width}px`).toBeLessThanOrEqual(2);
    }
  }
});

test('pricing monthly and annual values follow documented discount', async ({ page }) => {
  await page.goto('./pricing');
  await expect(page.locator('.billing--desktop input[value="annually"]')).toBeChecked();
  await expect(page.locator('#plan-plus .plan-price')).toContainText('$40');
  await expect(page.locator('#plan-expert .plan-price')).toContainText('$240');
  await expect(page.locator('#plan-business .plan-price')).toContainText('$720');
  await page.locator('.billing--desktop').getByRole('radio', { name: 'Monthly' }).check();
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
  await expect(dialog.getByRole('link', { name: 'Open Apcosys', exact: true })).toHaveAttribute(
    'href',
    deploymentSettings.signInUrl,
  );
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('#plan-business .stage-plan-contact')).toHaveAttribute(
    'href',
    /\/contact$/,
  );
});

test('documented HTTP API request and example response switch', async ({ page }) => {
  await page.goto('./developers/api');
  await expect(page.locator('.stage-code-window pre')).toContainText(
    'https://api.apcosys.net/api/v1/search/hosts',
  );
  await page.getByRole('button', { name: 'Response', exact: true }).click();
  await expect(page.locator('.stage-code-window pre')).toContainText('"open_ports"');
  await expect(page.locator('.stage-code-note')).toContainText('Example response.');
  await expect(page.locator('.stage-code-note')).toContainText('uts is the last update');
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
  await expect(
    page
      .getByRole('dialog', { name: 'PLUS plan' })
      .getByRole('link', { name: 'Open Apcosys', exact: true }),
  ).toHaveAttribute('href', deploymentSettings.signInUrl);
  await expect(page.locator('.site-header .header-signin')).toHaveAttribute(
    'href',
    deploymentSettings.signInUrl,
  );
});

test('contact form offers one email action and validates required fields', async ({ page }) => {
  await page.goto('./contact');
  await expect(page.getByRole('button', { name: 'Email us' })).toBeVisible();
  await page.getByRole('button', { name: 'Email us' }).click();
  await expect(page.locator('[name="name"]')).toHaveAttribute('required', '');
  await expect(page.locator('#contact-form .stage-form-actions button')).toHaveCount(1);
  await expect(page.locator('#contact-form [name="name"]')).toBeFocused();
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

for (const locale of [
  {
    language: 'en',
    prefix: '',
    developers: 'Developers',
    documentation: 'Documentation',
    action: 'View API Documentation',
    question: 'Can I use the API?',
  },
  {
    language: 'ru',
    prefix: 'ru/',
    developers: 'Разработчикам',
    documentation: 'Документация',
    action: 'Посмотреть документацию API',
    question: 'Могу ли я использовать API?',
  },
  {
    language: 'zh-Hant',
    prefix: 'zh-hant/',
    developers: '開發者',
    documentation: '文件',
    action: '查看 API 文件',
    question: '我可以使用 API 嗎？',
  },
]) {
  test(`${locale.language} documentation links open the localized standalone API reference`, async ({
    page,
    baseURL,
  }) => {
    const home = `./${locale.prefix}`;
    const destination = new URL(`${home}developers/api/docs`, baseURL!);
    const href = destination.pathname + destination.hash;
    const expectDocumentation = async () => {
      await expect(page).toHaveURL(destination.href);
      await expect(page.locator('html')).toHaveAttribute('lang', locale.language);
      await expect(page.locator('.api-docs h1')).toBeInViewport();
    };

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(home);
    await expect(page.locator('main h1')).toBeVisible();
    await page.locator('.desktop-nav').getByRole('button', { name: locale.developers }).click();
    const desktopLink = page
      .locator('.desktop-nav')
      .getByRole('link', { name: locale.documentation, exact: true });
    await expect(desktopLink).toHaveAttribute('href', href);
    await desktopLink.click();
    await expectDocumentation();

    await page.goto(`${home}developers/api`);
    const actions = page.locator('main').getByRole('link', { name: locale.action, exact: true });
    await expect(actions).toHaveCount(2);
    for (const action of await actions.all()) await expect(action).toHaveAttribute('href', href);
    await actions.last().click();
    await expectDocumentation();
    await page.goto(home);
    const footerLink = page
      .locator('footer')
      .getByRole('link', { name: locale.documentation, exact: true });
    await expect(footerLink).toHaveAttribute('href', href);
    await footerLink.click();
    await expectDocumentation();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(home);
    await expect(page.locator('main h1')).toBeVisible();
    await page.locator('.menu-toggle').click();
    const drawer = page.locator('dialog.mobile-navigation');
    const mobileLink = drawer.getByRole('link', { name: locale.documentation, exact: true });
    await expect(mobileLink).toHaveAttribute('href', href);
    await mobileLink.click();
    await expect(drawer).toBeHidden();
    await expectDocumentation();

    await page.goto(home);
    await page.getByText(locale.question, { exact: true }).click();
    const faqLink = page.locator('#faq a[href$="/developers/api/docs"]');
    await expect(faqLink).toHaveAttribute('href', href);
    await faqLink.click();
    await expectDocumentation();
    await expect(page.locator('.api-docs [data-example="first-request"] pre')).toBeVisible();

    await page.goto(`${home}developers/api#documentation`);
    await expect(page.locator('#documentation')).toBeInViewport();
    const fullReference = page.locator('#documentation a[href$="/developers/api/docs"]');
    await expect(fullReference).toHaveAttribute('href', href);
    await fullReference.click();
    await expectDocumentation();
  });
}

test('investigation page leads with one manual example and a separate live-search handoff', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./platform/search-investigation');
  await expect(page.locator('.stage-platform-search .search-form')).toHaveCount(0);
  await expect(page.locator('.stage-workbench__viewer')).toBeVisible();
  await expect(page.locator('.stage-workbench__step')).toHaveCount(3);
  await expect(page.locator('.stage-workbench form')).toHaveCount(1);
  await expect(page.locator('.stage-workbench__notice')).toContainText('Example records');
  await expect(page.locator('.stage-page-cta')).toHaveCount(0);
});
