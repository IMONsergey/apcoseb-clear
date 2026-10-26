import { expect, test, type Page } from '@playwright/test';
import ru from '../../src/i18n/translations/ru';
import zhHant from '../../src/i18n/translations/zh-Hant';
import { formatTypography } from '../../src/i18n/typography';
import { chooseSelectOption } from '../helpers/select';

const catalogs: Record<string, Record<string, string>> = { ru, 'zh-Hant': zhHant };
const localized = (locale: 'en' | 'ru' | 'zh-Hant', source: string) =>
  formatTypography(catalogs[locale]?.[source] ?? source, locale);
const prefix = (locale: 'en' | 'ru' | 'zh-Hant') =>
  locale === 'en' ? '' : locale === 'ru' ? 'ru/' : 'zh-hant/';

async function fillContact(
  page: Page,
  message = 'Please help evaluate our API research workflow.',
) {
  const form = page.locator('#contact-form');
  await form.locator('[name="name"]').fill('Audit Researcher');
  await form.locator('[name="email"]').fill('researcher@example.com');
  await form.locator('[name="company"]').fill('Example Research');
  await chooseSelectOption(form, 'API access');
  await form.locator('[name="message"]').fill(message);
  await form.locator('[name="consent"]').check();
  return form;
}

for (const locale of ['ru', 'zh-Hant'] as const) {
  test(`${locale} manual investigation keeps query, result and service controls localized`, async ({
    page,
  }) => {
    await page.goto(`./${prefix(locale)}platform/search-investigation`);
    const workbench = page.locator('.stage-workbench');
    await expect(workbench.locator('.stage-workbench__step strong')).toHaveText(
      ['Query', 'Results', 'Host'].map((label) => localized(locale, label)),
    );
    await expect(workbench.locator('label')).toHaveText(localized(locale, 'Example query'));
    await workbench.locator('button[type="submit"]').click();
    await expect(workbench.locator('.investigation-results__bar')).toContainText(
      localized(locale, 'Example matches'),
    );
    await workbench.locator('.investigation-result').first().click();
    await expect(workbench.locator('.investigation-detail-tabs button').first()).toHaveText(
      localized(locale, 'Response'),
    );
    await workbench.locator('.investigation-detail-tabs button').last().click();
    await expect(workbench.locator('.investigation-tls dt').first()).toHaveText(
      localized(locale, 'Server name'),
    );
    await expect(workbench.locator('.stage-workbench__notice')).toHaveText(
      localized(locale, 'Example records. Reserved addresses and synthetic responses.'),
    );
  });

  test(`${locale} monitoring translates human-readable change states`, async ({ page }) => {
    await page.goto(`./${prefix(locale)}platform/monitoring`);
    await expect(page.locator('.change-ledger code')).toHaveText([
      '443 → 443 + 22',
      localized(locale, 'Version A → Version B'),
      localized(locale, 'Observed → Not observed'),
    ]);
  });
}

test('reduced motion keeps the localized Home evidence readable without starting autoplay', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./ru/');
  const evidence = page.locator('.search-scene__results .product-evidence');
  await evidence.scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await expect(evidence).toHaveAttribute(
    'aria-label',
    localized('ru', 'Illustrative domain investigation'),
  );
  await expect(evidence.locator('.evidence-cursor')).toBeHidden();
  const read = () =>
    evidence.evaluate((root) => ({
      cursor: root.querySelector<HTMLElement>('.evidence-cursor')!.style.transform,
      clips: [
        ...root.querySelectorAll('.product-evidence__query strong, .evidence-response code'),
      ].map((element) => getComputedStyle(element).clipPath),
    }));
  const before = await read();
  expect(before.clips.every((clip) => clip === 'none')).toBe(true);
  await page.waitForTimeout(2400);
  expect(await read()).toEqual(before);
  await expect(evidence.locator('.evidence-response')).toContainText('Server: nginx/1.24.0');
});

test('unmatched example queries expose a recoverable empty state without stale host evidence', async ({
  page,
}) => {
  await page.goto('./platform/search-investigation');
  const workbench = page.locator('.stage-workbench');
  await workbench.locator('input[name="example_query"]').fill('unlisted.example.net');
  await workbench.locator('button[type="submit"]').click();
  await expect(workbench.getByRole('status')).toContainText('No matching example hosts');
  await expect(workbench.locator('.investigation-result, .investigation-host')).toHaveCount(0);
  const steps = workbench.locator('.stage-workbench__step');
  await expect(steps.last()).toBeDisabled();
  await steps.nth(1).focus();
  await steps.nth(1).press('ArrowRight');
  await expect(steps.first()).toBeFocused();
  await expect(workbench.locator('input[name="example_query"]')).toHaveValue(
    'unlisted.example.net',
  );
  await steps.nth(1).click();
  await workbench.getByRole('button', { name: 'Show example hosts' }).click();
  await expect(workbench.locator('.investigation-result')).toHaveCount(2);
  await expect(steps.last()).toBeEnabled();
});

test('investigation deep links preserve the host while switching service response and TLS', async ({
  page,
}) => {
  await page.goto('./platform/search-investigation?demoHost=203.0.113.42');
  const workbench = page.locator('.stage-workbench');
  await expect(workbench.locator('.stage-workbench__step').last()).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(workbench.locator('.investigation-host__heading')).toContainText('203.0.113.42');
  const services = workbench.locator('.investigation-service-catalog button');
  await services.nth(1).click();
  await expect(workbench.locator('.investigation-service-detail__body')).toContainText(
    'SSH-2.0-OpenSSH_9.6',
  );
  await expect(workbench.locator('.investigation-detail-tabs button').last()).toBeDisabled();
  await services.first().click();
  await workbench.locator('.investigation-detail-tabs button').last().click();
  await expect(workbench.locator('.investigation-tls')).toContainText('gateway.example.com');
  await services.nth(1).click();
  await expect(workbench.locator('.investigation-tls')).toHaveCount(0);
  await expect(workbench.locator('.investigation-service-detail__body')).toContainText(
    'SSH-2.0-OpenSSH_9.6',
  );
});

for (const locale of ['en', 'ru', 'zh-Hant'] as const) {
  test(`${locale} contact draft survives reading the privacy policy, Back and reload`, async ({
    page,
  }) => {
    await page.goto(`./${prefix(locale)}contact`);
    const form = await fillContact(page);
    await form.locator('a[href*="privacy-policy"]').click();
    await expect(page.locator('main')).toHaveAttribute('data-route', '/legal/privacy-policy');
    await page.goBack();
    await expect(page.locator('main')).toHaveAttribute('data-route', '/contact');
    await expect(form.locator('[name="name"]')).toHaveValue('Audit Researcher');
    await expect(form.locator('[name="email"]')).toHaveValue('researcher@example.com');
    await expect(form.locator('[name="company"]')).toHaveValue('Example Research');
    await expect(form.locator('[name="topic"]')).toHaveValue('API access');
    await expect(form.locator('[name="message"]')).toHaveValue(
      'Please help evaluate our API research workflow.',
    );
    await expect(form.locator('[name="consent"]')).toBeChecked();
    await page.reload();
    await expect(form.locator('[name="message"]')).toHaveValue(
      'Please help evaluate our API research workflow.',
    );
  });
}

test('disabled session storage still preserves the contact draft during SPA navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get: () => {
        throw new DOMException('Storage disabled', 'SecurityError');
      },
    });
  });
  await page.goto('./contact');
  const form = await fillContact(page);
  await form.locator('a[href*="privacy-policy"]').click();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/legal/privacy-policy');
  await page.goBack();
  await expect(form.locator('[name="message"]')).toHaveValue(
    'Please help evaluate our API research workflow.',
  );
});

test('contact drafts expire after 24 hours in the tab', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2030-01-01T00:00:00Z'));
  await page.goto('./contact');
  await fillContact(page);
  await page.clock.setFixedTime(new Date('2030-01-02T01:00:00Z'));
  await page.reload();
  await expect(page.locator('#contact-form [name="message"]')).toHaveValue('');
  await expect(page.locator('#contact-form [name="email"]')).toHaveValue('');
});

test('failed storage writes preserve the newest contact draft in memory', async ({ page }) => {
  await page.goto('./contact');
  const form = await fillContact(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage full', 'QuotaExceededError');
    };
  });
  const updated = 'This updated message must survive even when the storage quota is full.';
  await form.locator('[name="message"]').fill(updated);
  await form.locator('a[href*="privacy-policy"]').click();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/legal/privacy-policy');
  await page.goBack();
  await expect(form.locator('[name="message"]')).toHaveValue(updated);
});

test('contact keeps a long message editable without duplicating it into a preview', async ({
  page,
}) => {
  await page.goto('./contact');
  const message = 'Ж'.repeat(6000);
  const form = await fillContact(page, message);
  await expect(form.locator('[name="message"]')).toHaveValue(message);
  await expect(form.locator('[name="message"]')).toHaveAttribute('maxlength', '6000');
  await expect(form.locator('.stage-form-actions button')).toHaveCount(1);
  await expect(form.locator('.stage-prepared-email')).toHaveCount(0);
  await chooseSelectOption(form, 'Other');
  await expect(form.locator('[name="message"]')).toHaveValue(message);
});

for (const motion of ['no-preference', 'reduce'] as const) {
  test(`${motion} mobile navigation focuses the new heading after the drawer closes`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await page.setViewportSize({ width: 390, height: 844 });
    // Visiting first makes the destination chunk warm, reproducing the original focus race.
    await page.goto('./pricing');
    await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
    await page.locator('.brand').click();
    await expect(page.locator('main')).toHaveAttribute('data-route', '/');
    const toggle = page.locator('.menu-toggle');
    await toggle.click();
    const drawer = page.locator('dialog.mobile-navigation');
    const pricing = drawer.locator('a[href$="/pricing"]');
    await pricing.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toHaveAttribute('data-route', '/pricing');
    await expect(drawer).not.toBeVisible();
    await expect(page.locator('main h1')).toBeFocused();
    await page.waitForTimeout(300);
    await expect(page.locator('main h1')).toBeFocused();
    await toggle.click();
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
    await expect(toggle).toBeFocused();
  });
}

test('language selectors include their visible abbreviation in the accessible name', async ({
  page,
}) => {
  for (const locale of ['en', 'ru', 'zh-Hant'] as const) {
    await page.goto(`./${prefix(locale)}contact`);
    const language = page.locator('[data-language-selector]');
    const visible = (await language.locator('.locale-text').innerText()).trim();
    await expect(language).toHaveAccessibleName(new RegExp(visible));
    await language.focus();
    await page.keyboard.press('ArrowDown');
    await expect(
      page.locator('.language-panel [role="menuitemradio"][aria-checked="true"]'),
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(language).toBeFocused();
  }
});

for (const { locale, pattern, reload } of [
  {
    locale: 'ru',
    pattern: /\/(?:assets\/ru-[^/]+\.js|src\/i18n\/translations\/ru\.ts)(?:\?.*)?$/,
    reload: 'Перезагрузить страницу',
  },
  {
    locale: 'zh-Hant',
    pattern: /\/(?:assets\/zh-Hant-[^/]+\.js|src\/i18n\/translations\/zh-Hant\.ts)(?:\?.*)?$/,
    reload: '重新載入頁面',
  },
  {
    locale: 'ru',
    pattern:
      /\/(?:assets\/(?:onest|russian-type)-[^/]+\.css|src\/styles\/(?:onest|russian-type)\.css)(?:\?.*)?$/,
    reload: 'Перезагрузить страницу',
  },
] as const) {
  test(`${locale} bootstrap recovers from an unavailable ${pattern.source.includes('styles') ? 'font stylesheet' : 'translation chunk'}`, async ({
    page,
  }) => {
    let blocked = 0;
    await page.route(pattern, (route) => {
      blocked++;
      return route.abort('failed');
    });
    await page.goto(`./${prefix(locale)}contact?topic=API%20access#contact-form`);
    const fallback = page.locator('main[data-startup-error]');
    await expect(fallback).toBeVisible();
    expect(blocked).toBeGreaterThan(0);
    await expect(fallback.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(fallback.getByRole('link')).toHaveAttribute(
      'href',
      /\/contact\?topic=API%20access#contact-form$/,
    );
    await page.unroute(pattern);
    await fallback.getByRole('button', { name: reload, exact: true }).click();
    await expect(page.locator('main')).toHaveAttribute('data-route', '/contact');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(fallback).toHaveCount(0);
  });
}

test('interrupting a native view transition does not report an unhandled rejection', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = (update) =>
      start(async () => {
        const callback = typeof update === 'function' ? update : update?.update;
        await callback?.();
        // Keep the real browser transition pending as a slow update would, then interrupt it.
        await new Promise((resolve) => setTimeout(resolve, 300));
      });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./contact');
  test.skip(
    !(await page.evaluate(() => Boolean(document.startViewTransition))),
    'Native View Transition API is unavailable.',
  );
  await page.locator('#contact-form a[href*="privacy-policy"]').click();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/legal/privacy-policy');
  await page.goBack();
  await expect(page.locator('main')).toHaveAttribute('data-route', '/contact');
  await page.waitForTimeout(700);
  expect(errors).toEqual([]);
});

test('passive pointer movement on 404 does not start play or steal keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./missing-runtime-regression');
  const home = page.locator('.arcade404-home');
  const board = page.locator('.arcade404-board');
  const game = page.locator('.arcade404-game');
  await home.focus();
  await board.hover();
  await expect(home).toBeFocused();
  await expect(game).toHaveAttribute('data-game-state', 'idle');
  await board.click();
  await expect(board).toBeFocused();
  await expect(game).toHaveAttribute('data-game-state', 'running');
  await page.keyboard.press('Space');
  await expect(game).toHaveAttribute('data-game-state', 'paused');
});
