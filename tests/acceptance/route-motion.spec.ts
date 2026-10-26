import { expect, test } from '@playwright/test';
import { openLanguageMenu, revealHeader } from '../helpers/locale';

for (const mode of ['native', 'fallback', 'reduced'] as const) {
  test(`navigation keeps the current page while loading and restores history: ${mode}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
    if (mode === 'fallback')
      await page.addInitScript(() => {
        Object.defineProperty(document, 'startViewTransition', { value: undefined });
      });
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let requested = false;
    await page.route('**/CommercialPages-*.js', async (route) => {
      requested = true;
      await gate;
      await route.continue();
    });
    await page.goto('./platform/data-methodology');
    await expect(page.locator('main h1')).toBeVisible();
    const heading = await page.locator('main h1').textContent();
    await page.evaluate(() => scrollTo({ top: 700, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => history.state?.apcoScrollY)).toBe(700);
    await page.evaluate(() => {
      document.querySelector<HTMLAnchorElement>('.site-header a[href$="/pricing"]')!.click();
    });
    await expect.poll(() => requested).toBe(true);
    await page.waitForTimeout(250);
    await expect(page.locator('main h1')).toHaveText(heading!);
    await expect(page.locator('.route-fallback')).toHaveCount(0);
    expect(await page.evaluate(() => scrollY)).toBe(700);
    release!();
    await expect(page.locator('main h1')).toContainText('Choose the access');
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('main h1')).toBeFocused();
    // Back may interrupt the still-running view transition.
    await page.goBack();
    await expect(page.locator('main h1')).toHaveText(heading!);
    await expect.poll(() => page.evaluate(() => Math.abs(scrollY - 700))).toBeLessThan(2);
    await page.goForward();
    await expect(page.locator('main h1')).toContainText('Choose the access');
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  });
}

test('data-type changes keep text visible without masks or duplicate states', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const panel = page.locator('.data-lens > .morph-panel');
  await panel.scrollIntoViewIfNeeded();
  const frames = await page.evaluate(async () => {
    const samples: { opacity: string; clip: string; copies: number; heading: string }[] = [];
    const root = document.querySelector('.data-lens > .morph-panel')!;
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      '.home-searchable__index button',
    )) {
      button.click();
      for (let i = 0; i < 12; i++) {
        await new Promise(requestAnimationFrame);
        const content = root.querySelector('.morph-panel__content')!;
        const style = getComputedStyle(content);
        samples.push({
          opacity: style.opacity,
          clip: style.clipPath,
          copies: root.querySelectorAll('.data-lens__body').length,
          heading: root.parentElement!.getAttribute('aria-label')!,
        });
      }
    }
    return samples;
  });
  expect(new Set(frames.map((frame) => frame.heading)).size).toBe(5);
  for (const frame of frames) {
    expect(frame.opacity).toBe('1');
    expect(frame.clip).toBe('none');
    expect(frame.copies).toBe(1);
  }
  await expect(panel.locator('.morph-panel__outgoing')).toHaveCount(0);
});

test('returning to the current page cancels an unfinished navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let requested = false;
  await page.route('**/CommercialPages-*.js', async (route) => {
    requested = true;
    await gate;
    await route.continue();
  });
  await page.goto('./');
  await expect(page.locator('main h1')).toBeVisible();
  await page.evaluate(() =>
    document.querySelector<HTMLAnchorElement>('.site-header a[href$="/pricing"]')!.click(),
  );
  await expect.poll(() => requested).toBe(true);
  await page.evaluate(() =>
    document.querySelector<HTMLAnchorElement>('.site-header .brand')!.click(),
  );
  release!();
  await page.waitForTimeout(700);
  await expect(page.locator('main')).toHaveAttribute('data-route', '/');
  await expect(page).not.toHaveURL(/\/pricing$/);
});

for (const mode of ['native', 'fallback', 'reduced'] as const) {
  test(`history restores the reading position beyond a URL anchor: ${mode}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
    if (mode === 'fallback')
      await page.addInitScript(() => {
        Object.defineProperty(document, 'startViewTransition', { value: undefined });
      });
    await page.goto('./platform/search-investigation#search-syntax');
    await expect(page.locator('#search-syntax')).toBeInViewport();
    await page.evaluate(() => document.fonts.ready);
    for (const y of [0, 800]) {
      await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
      await expect.poll(() => page.evaluate(() => history.state?.apcoScrollY)).toBe(y);
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>('.site-header a[href$="/pricing"]')!.click();
      });
      await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.goBack();
      await expect(page.locator('main')).toHaveAttribute(
        'data-route',
        '/platform/search-investigation',
      );
      await expect(page).toHaveURL(/#search-syntax$/);
      await expect.poll(() => page.evaluate((top) => Math.abs(scrollY - top), y)).toBeLessThan(2);
    }
    await page.reload();
    await expect(page.locator('#search-syntax')).toBeAttached();
    await expect.poll(() => page.evaluate(() => Math.abs(scrollY - 800))).toBeLessThan(2);
  });
}

for (const width of [390, 1440]) {
  test(`reselecting the current route returns to its start without another history entry: ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('./');
    await expect(page.locator('.hero h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
    await revealHeader(page);
    const entries = await page.evaluate(() => history.length);
    await page.locator('.brand').click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    expect(await page.evaluate(() => history.length)).toBe(entries);
    if (width < 1200) {
      await page.goto('./pricing');
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => scrollTo({ top: 500, behavior: 'instant' }));
      await revealHeader(page);
      await page.locator('.menu-toggle').click();
      await page.locator('.mobile-navigation .mobile-pricing[href$="/pricing"]').click();
      await expect(page.locator('dialog[open]')).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    }
  });
}

for (const mode of ['native', 'fallback', 'reduced'] as const) {
  test(`continuous scrolling limits history writes and keeps the latest position: ${mode}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
    if (mode === 'fallback')
      await page.addInitScript(() => {
        Object.defineProperty(document, 'startViewTransition', { value: undefined });
      });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('./platform/search-investigation#search-syntax');
    await expect(page.locator('#search-syntax')).toBeInViewport();
    await page.evaluate(() => document.fonts.ready);
    const sample = await page.evaluate(async () => {
      const replace = history.replaceState.bind(history);
      let writes = 0;
      history.replaceState = (...args: Parameters<History['replaceState']>) => {
        writes++;
        return replace(...args);
      };
      const start = performance.now();
      for (let frame = 0; frame < 150; frame++) {
        scrollTo({ top: 200 + frame * 3, behavior: 'instant' });
        await new Promise(requestAnimationFrame);
      }
      history.replaceState = replace;
      return { writes, elapsed: performance.now() - start };
    });
    expect(sample.writes).toBeLessThanOrEqual(Math.ceil(sample.elapsed / 400) + 2);
    await test.info().attach('scroll-history', {
      body: JSON.stringify(sample),
      contentType: 'application/json',
    });
    expect(errors).toEqual([]);

    await page.evaluate(() => {
      document.querySelector<HTMLAnchorElement>('.site-header a[href$="/pricing"]')!.click();
    });
    await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('main h1')).toBeFocused();
    const departedY = await page.evaluate(() => {
      scrollTo({ top: 600, behavior: 'instant' });
      // Leave before the next persisted snapshot; Forward still needs the exact position.
      window.dispatchEvent(new Event('scroll'));
      const y = scrollY;
      history.back();
      return y;
    });
    expect(departedY).toBe(600);
    await expect(page.locator('main')).toHaveAttribute(
      'data-route',
      '/platform/search-investigation',
    );
    await expect.poll(() => page.evaluate(() => Math.abs(scrollY - 647))).toBeLessThan(2);
    await page.goForward();
    await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
    await expect.poll(() => page.evaluate(() => Math.abs(scrollY - 600))).toBeLessThan(2);
    expect(errors).toEqual([]);
  });
}

for (const storage of ['available', 'restricted'] as const) {
  test(`reload preserves the latest reading position with ${storage} session storage`, async ({
    page,
  }) => {
    if (storage === 'restricted')
      await page.addInitScript(() => {
        Object.defineProperty(window, 'sessionStorage', {
          get() {
            throw new DOMException('Storage is restricted', 'SecurityError');
          },
        });
      });
    await page.goto('./legal/terms');
    await expect(page.locator('.legal-copy')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      scrollTo({ top: 800, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    });
    if (storage === 'restricted')
      await expect.poll(() => page.evaluate(() => history.state?.apcoScrollY)).toBe(800);
    await page.reload();
    await expect(page.locator('.legal-copy')).toBeVisible();
    await expect.poll(() => page.evaluate(() => Math.abs(scrollY - 800))).toBeLessThan(2);
  });
}

for (const input of ['pointer', 'keyboard'] as const) {
  test(`Delayed route keeps a newly opened language menu and focus: ${input}`, async ({ page }) => {
    let release = () => {};
    let requested = false;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/legal-documents-[\w-]+\.js$/, async (route) => {
      requested = true;
      await held;
      await route.continue();
    });
    try {
      await page.goto('./contact');
      await expect(page.locator('main h1')).toBeVisible();
      await page.locator('.stage-consent a[href$="/legal/privacy-policy"]').click();
      await expect.poll(() => requested).toBe(true);
      if (input === 'pointer') await openLanguageMenu(page);
      else {
        await revealHeader(page);
        await page.locator('[data-language-selector]').press('Enter');
      }
      await expect(page.locator('.language-panel')).toHaveCSS('opacity', '1');
      release();
      await expect(page.locator('.legal-copy')).toBeVisible();
      await expect(page.locator('main')).toHaveAttribute('data-route', '/legal/privacy-policy');
      await expect(page.locator('[data-language-selector]')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      await expect
        .poll(() =>
          page.evaluate(() =>
            document.querySelector('.language-control')?.contains(document.activeElement),
          ),
        )
        .toBe(true);
      await page.getByRole('menuitemradio', { name: 'Русский', exact: true }).click();
      await expect(page).toHaveURL(/\/ru\/legal\/privacy-policy\/?$/);
      await expect(page.locator('.legal-copy')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    } finally {
      release();
    }
  });
}
