import { expect, test } from '@playwright/test';

test('all six application frames remain readable when their motion chunks fail', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const failed = new Set<string>();
  await page.route(/\/assets\/applicationPlayback-[^/]+\.js$/, async (route) => {
    failed.add(route.request().url());
    await route.abort('failed');
  });
  await page.goto('./');
  for (const [scene, heading] of [
    ['query', '.application-query-title'],
    ['results', '.application-results-heading'],
    ['host', '.application-host-services-title'],
    ['evidence', '.application-certificate-title'],
    ['suggestions', '.application-refine-heading'],
    ['api', '.application-api__heading'],
  ]) {
    const frame = page.locator(`.application-scene[data-scene="${scene}"]`);
    await frame.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute('data-demo-playback', 'static');
    await expect(frame.locator('.application-demo-cursor')).toBeHidden();
    await expect(frame.locator(heading!)).toBeVisible();
    await expect(frame.locator(heading!)).not.toBeEmpty();
    if (scene === 'query') await expect(frame.locator('[data-demo-query]')).toHaveText('nginx');
    if (scene === 'results') {
      await expect(frame.locator('.application-results-all')).toHaveText('4 hosts returned');
      await expect(frame.locator('.application-result-address')).toHaveCount(2);
    }
    if (scene === 'host' || scene === 'evidence') {
      await expect(frame).toContainText('192.0.2.10');
      await expect(frame).toContainText('node-1.example.com');
    }
    if (scene === 'evidence') {
      await expect(frame.locator('[data-demo-target="tls-names"]')).toContainText(
        'node-1.example.com',
      );
      await expect(frame.locator('.application-status')).toHaveText('TLS 1.3');
      await expect(frame.locator('.application-fingerprint')).toHaveCount(0);
    }
    if (scene === 'suggestions')
      await expect(frame.locator('.application-applied')).toContainText('node-1.example.com');
    if (scene === 'api') {
      const keyPanel = frame.locator('[data-api-panel="key"]');
      await expect(keyPanel).toBeVisible();
      await expect(frame.locator('[data-api-panel="usage"]')).toBeHidden();
      await expect(frame.locator('[data-demo-target="api-key"]')).toHaveText(/^•{16}$/);
      await expect(frame.locator('[role="meter"]:visible')).toHaveCount(0);
      await expect(keyPanel.locator('.application-api__summary')).toContainText('1,240,500');
      await expect(frame.locator('[data-api-panel="usage"] [role="meter"]')).toHaveCount(2);
    }
    expect(
      await frame
        .locator('img')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
          ),
        ),
    ).toBe(true);
  }
  expect([...failed].some((url) => url.includes('/applicationPlayback-'))).toBe(true);
  await expect(page.locator('.application-scene')).toHaveCount(6);
  await expect(page.locator('main[data-startup-error]')).toHaveCount(0);
});
