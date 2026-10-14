import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';
import { readPublicSettings } from '../../src/config/public-settings';

for (const failure of ['network', 'server'] as const) {
  test(`failed initial page download (${failure}) retains navigation and offers working reload`, async ({
    page,
  }) => {
    const chunk = /\/HomePage-[\w-]+\.js(?:\?.*)?$/;
    let unavailable = true;
    // Both failures must recover in the same browser context without cache clearing.
    await page.route(chunk, (route) =>
      unavailable
        ? failure === 'network'
          ? route.abort()
          : route.fulfill({ status: 503, headers: { 'cache-control': 'no-store' }, body: '' })
        : route.continue(),
    );
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'This page could not load.' })).toBeVisible();
    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('.footer')).toBeVisible();
    unavailable = false;
    await page.getByRole('button', { name: 'Reload page', exact: true }).click();
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.locator('.route-error')).toHaveCount(0);
  });
}

test('every route publishes its own title and description in static HTML', async ({ request }) => {
  for (const route of siteRoutes) {
    const response = await request.get('.' + route.path + (route.path === '/' ? '' : '/'));
    expect(response.ok(), route.path).toBe(true);
    const html = await response.text();
    const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    const title = route.path === '/' ? 'Apcosys — Start with a query.' : route.title + ' | Apcosys';
    expect(html, route.path).toContain('<title>' + escape(title) + '</title>');
    expect(html, route.path).toContain('content="' + escape(route.description) + '"');
  }
});

test('canonical and Open Graph URL follow client navigation', async ({ page }) => {
  await page.goto('./about');
  await page.locator('.site-header').getByRole('link', { name: 'Pricing', exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
  const url = new URL(page.url());
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    url.origin + url.pathname,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    url.origin + url.pathname,
  );
});

test('all rendered internal links and section anchors have destinations', async ({ page }) => {
  test.setTimeout(90_000);
  const pages = new Map<string, Set<string>>();
  const links: Array<{ from: string; url: string }> = [];
  await page.goto('./');
  const base = new URL('./', page.url());
  for (const route of siteRoutes) {
    await page.goto('.' + route.path);
    await expect(page.locator('main h1')).toBeVisible();
    const data = await page.evaluate(() => ({
      ids: [...document.querySelectorAll('[id]')].map((el) => el.id),
      urls: [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].map((el) => el.href),
    }));
    pages.set(route.path, new Set(data.ids));
    links.push(...data.urls.map((url) => ({ from: route.path, url })));
  }
  for (const link of links) {
    const url = new URL(link.url);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) continue;
    const route = '/' + url.pathname.slice(base.pathname.length).replace(/\/$/, '');
    expect(pages.has(route), `${link.from} → ${url.pathname}`).toBe(true);
    if (url.hash)
      expect(
        pages.get(route)?.has(decodeURIComponent(url.hash.slice(1))),
        `${link.from} → ${url.pathname}${url.hash}`,
      ).toBe(true);
  }
});

test('no-JavaScript search link tracks the configured product origin', async ({ request }) => {
  const response = await request.get('./');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  const fallback = html.match(/<noscript[\s\S]*?<a href="([^"]+)">Open public search<\/a>/);
  expect(fallback, 'search must remain available without JavaScript').not.toBeNull();
  expect(fallback?.[1]).toBe(new URL('/search', readPublicSettings(process.env).productUrl).href);
  expect(html).not.toContain('__APCO_PUBLIC_SEARCH_URL__');
});
