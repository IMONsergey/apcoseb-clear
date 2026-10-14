import { expect, test } from '@playwright/test';

test('custom fonts resolve from the deployed base path', async ({ page }) => {
  const fontRequests: string[] = [];
  const failed: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fontRequests.push(request.url());
  });
  page.on('response', (response) => {
    // Firefox may revalidate a successfully cached font with HTTP 304.
    // Assert genuine HTTP failures and verify the resulting FontFace state below.
    if (response.url().endsWith('.woff2') && response.status() >= 400) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto('./');
  const faces = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 18px "Instrument Sans"', 'Apcosys'),
      document.fonts.load('400 18px "IBM Plex Mono"', 'Credits'),
    ]);
    return [...document.fonts].map(({ family, status }) => ({ family, status }));
  });
  const base = new URL('./', page.url()).href;
  expect(failed).toEqual([]);
  expect(fontRequests.length).toBeGreaterThan(0);
  expect(fontRequests.every((url) => url.startsWith(`${base}fonts/`))).toBe(true);
  expect(
    faces.some((face) => face.family.includes('Instrument Sans') && face.status === 'loaded'),
  ).toBe(true);
  expect(
    faces.some((face) => face.family.includes('IBM Plex Mono') && face.status === 'loaded'),
  ).toBe(true);
});
