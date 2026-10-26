import { expect, test } from '@playwright/test';

const essentialAssets = [
  'assets/brand/favicon.svg',
  'assets/brand/logo.svg',
  'assets/application/code.svg',
  'assets/illustrations/closing/start-desktop.webp',
  'assets/illustrations/closing/start-390-dark.webp',
  'assets/inner/search.webp',
  'assets/editorial/evidence-dark-600.webp',
  'fonts/instrument-sans-latin.woff2',
  'fonts/ibm-plex-mono-latin.woff2',
] as const;

test('essential assets resolve at the deployment base path', async ({ page, request }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const baseURL = new URL('./', page.url());

  for (const pathname of essentialAssets) {
    const url = new URL(pathname, baseURL).toString();
    const response = await request.get(url);
    expect(response.ok(), `Asset should load: ${pathname}`).toBe(true);
    expect((await response.body()).byteLength).toBeGreaterThan(0);
  }
});
