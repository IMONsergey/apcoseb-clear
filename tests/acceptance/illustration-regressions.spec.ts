import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

const locales = [
  {
    route: './',
    language: 'en',
    query: 'Search internet infrastructure.',
    results: '4 hosts returned',
    services: 'Services',
    certificate: 'Certificate identity',
    issuer: 'Example Certificate Authority',
    applied: 'Applied condition',
    apiHeading: 'API access',
    quotas: ['Query credits remaining', 'Scan credits remaining'],
    closing: 'Start with your first query.',
    action: 'Try free search',
  },
  {
    route: './ru/',
    language: 'ru',
    query: 'Поиск инфраструктуры интернета.',
    results: 'Найдено 4 хоста',
    services: 'Сервисы',
    certificate: 'Сведения о сертификате',
    issuer: 'Пример удостоверяющего центра',
    applied: 'Применённое условие',
    apiHeading: 'Доступ к API',
    quotas: ['Остаток кредитов на запросы', 'Остаток кредитов на сканирование'],
    closing: 'Начните с первого запроса.',
    action: 'Попробовать бесплатно',
  },
  {
    route: './zh-hant/',
    language: 'zh-Hant',
    query: '搜尋網際網路基礎設施。',
    results: '找到 4 個主機',
    services: '服務',
    certificate: '憑證識別資訊',
    issuer: '範例憑證機構',
    applied: '已套用條件',
    apiHeading: 'API 存取',
    quotas: ['剩餘查詢額度', '剩餘掃描額度'],
    closing: '從第一個查詢開始。',
    action: '試用免費搜尋',
  },
] as const;

async function openHome(page: Page, route: string, theme: 'light' | 'dark', width: number) {
  await page.setViewportSize({ width, height: 950 });
  await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
  await page.goto(route);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.evaluate(() => document.fonts.ready);
}

/** Inspect rendered glyphs, including shadow DOM, against actual clipping ancestors.
 * This catches scaled-down desktop text and content below a fixed-height excerpt.
 * Invisible animation layers and intentionally omitted detail are not user-visible text.
 */
async function expectReadableContents(container: Locator, minimumFont = 11.5, checkBounds = true) {
  const result = await container.evaluate(
    (host, { minimum, checkBounds }) => {
      const root = host.shadowRoot ?? host;
      const bounds = host.getBoundingClientRect();
      const describeOverflow = (rect: DOMRect, clip: DOMRect) =>
        Object.entries({
          left: clip.left - rect.left,
          right: rect.right - clip.right,
          top: clip.top - rect.top,
          bottom: rect.bottom - clip.bottom,
        })
          .filter(([, amount]) => amount > 1)
          .map(([edge, amount]) => `${edge} ${amount.toFixed(2)}px`)
          .join(', ');
      const parentOf = (element: Element): Element | null => {
        if (element.parentElement) return element.parentElement;
        const tree = element.getRootNode();
        return tree instanceof ShadowRoot ? tree.host : null;
      };
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const issues: { text: string; reason: string; detail: string }[] = [];
      let count = 0;
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        const element = node.parentElement;
        if (!text || !element || element.closest('style, script, template')) continue;
        const ancestors: Element[] = [];
        for (let ancestor: Element | null = element; ancestor; ancestor = parentOf(ancestor))
          ancestors.push(ancestor);
        const styles = ancestors.map((ancestor) => getComputedStyle(ancestor));
        if (
          styles.some(
            (style) =>
              style.display === 'none' ||
              style.visibility !== 'visible' ||
              Number(style.opacity) === 0,
          )
        )
          continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()].filter((rect) => rect.width && rect.height);
        if (!rects.length) continue;
        count++;
        let scale = 1;
        for (const style of styles) {
          if (style.transform !== 'none') {
            const matrix = new DOMMatrixReadOnly(style.transform);
            scale *= Math.hypot(matrix.a, matrix.b);
          }
        }
        const font = parseFloat(styles[0]!.fontSize) * scale;
        if (font < minimum)
          issues.push({ text, reason: 'small text', detail: `${font.toFixed(2)}px` });
        for (const rect of rects) {
          if (
            checkBounds &&
            (rect.left < bounds.left - 1 ||
              rect.right > bounds.right + 1 ||
              rect.top < bounds.top - 1 ||
              rect.bottom > bounds.bottom + 1)
          )
            issues.push({
              text,
              reason: 'outside excerpt',
              detail: `${host.className}: ${describeOverflow(rect, bounds)}`,
            });
          for (let index = 0; index < ancestors.length; index++) {
            const style = styles[index]!;
            const clipX = /^(hidden|clip|auto|scroll)$/.test(style.overflowX);
            const clipY = /^(hidden|clip|auto|scroll)$/.test(style.overflowY);
            if (!clipX && !clipY) continue;
            const ancestor = ancestors[index]!;
            // The page viewport scrolls normally; the regression concerns component clipping.
            if (ancestor === document.documentElement || ancestor === document.body) continue;
            const clip = ancestor.getBoundingClientRect();
            if (
              (clipX && (rect.left < clip.left - 1 || rect.right > clip.right + 1)) ||
              (clipY && (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1))
            )
              issues.push({
                text,
                reason: 'clipped text',
                detail: `${ancestor.className}: ${describeOverflow(rect, clip)}`,
              });
          }
        }
      }
      return { count, issues, scene: host.getAttribute('data-scene') || host.className };
    },
    { minimum: minimumFont, checkBounds },
  );
  expect(
    result.count,
    'the illustration must contain readable text, not only a raster',
  ).toBeGreaterThan(0);
  if (result.issues.length) {
    const screenshotPath = test
      .info()
      .outputPath(
        `clipped-${result.scene.replace(/[^a-z0-9_-]/gi, '-')}-${test.info().attachments.length}.png`,
      );
    await container.screenshot({ path: screenshotPath });
    await test.info().attach(`clipped-scene-${result.scene}`, {
      path: screenshotPath,
      contentType: 'image/png',
    });
  }
  expect
    .soft(result.issues, `${result.scene}: all displayed glyphs must fit at a readable size`)
    .toEqual([]);
}

async function expectDecodedAssets(scene: Locator) {
  expect(
    await scene.locator('img, svg').count(),
    'application icons remain present',
  ).toBeGreaterThan(0);
  const broken = await scene.evaluate(async (host) => {
    const masks = new Set(
      [...host.querySelectorAll('*')].flatMap((element) =>
        [...getComputedStyle(element).maskImage.matchAll(/url\((['"]?)(.*?)\1\)/g)].map(
          (match) => match[2]!,
        ),
      ),
    );
    const images = [
      ...host.querySelectorAll('img'),
      ...[...masks].map((source) => {
        const image = new Image();
        image.src = source;
        return image;
      }),
    ];
    const results = await Promise.all(
      images.map(async (image) => {
        try {
          await image.decode();
          return image.naturalWidth > 0 && image.naturalHeight > 0 ? null : image.currentSrc;
        } catch {
          return image.currentSrc || image.src;
        }
      }),
    );
    return results.filter((source) => source !== null);
  });
  expect(broken, 'every referenced illustration image and mask must decode').toEqual([]);
}

async function expectApplicationScene(scene: Locator) {
  await expect(scene).toBeVisible();
  await expect(scene).toHaveAttribute('data-demo-playback', 'static');
  await expect(scene).toHaveAttribute('data-demo-phase', '0');
  await expect(scene.locator('.application-demo-cursor')).toBeHidden();
  if ((await scene.getAttribute('data-scene')) !== 'api') {
    const deviations = await scene.evaluate((element) => {
      const frame = element.closest('.step-illustration')!.getBoundingClientRect();
      const content = element.getBoundingClientRect();
      return [
        content.left - frame.left,
        content.top - frame.top,
        content.right - frame.right,
        content.bottom - frame.bottom,
      ].map(Math.abs);
    });
    expect(
      Math.max(...deviations),
      'the research scene fills the actual illustration frame on every browser',
    ).toBeLessThanOrEqual(1);
  }
  await expectDecodedAssets(scene);
}

test('results and TLS excerpts adapt at their actual narrow container boundaries', async ({
  page,
}) => {
  await openHome(page, './ru/', 'light', 1440);
  for (const name of ['results', 'evidence']) {
    const scene = page.locator(`.application-scene[data-scene="${name}"]`);
    await scene.scrollIntoViewIfNeeded();
    for (const width of [279, 280, 292, 319, 320]) {
      await test.step(`${name}: ${width}px container`, async () => {
        const inlineSize = await scene.evaluate((element: HTMLElement, width) => {
          const style = getComputedStyle(element);
          const borders = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
          element.style.width = `${width + borders}px`;
          return (
            element.getBoundingClientRect().width -
            borders -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight)
          );
        }, width);
        expect(inlineSize).toBeCloseTo(width, 1);
        if (name === 'results') {
          const columns = scene.locator('.application-results-columns');
          expect(
            await columns.evaluate(
              (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
            ),
          ).toBe(width <= 319 ? 2 : 3);
          await expect(
            scene.locator('.application-result > .application-country:visible'),
          ).toHaveCount(2);
        } else {
          const dns = scene.locator('[data-demo-target="tls-names"]');
          if (width <= 319) await expect(dns).toBeHidden();
          else await expect(dns).toBeVisible();
          await expect(scene.locator('.application-certificate dd').first()).toHaveText(
            'node-1.example.com',
          );
        }
        await expectReadableContents(scene, 11.5, true);
      });
    }
  }
});

for (const locale of locales) {
  test(`application TLS playback preserves the selected HTTPS certificate context: ${locale.language}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openHome(page, locale.route, 'light', 1440);
    await page.locator('.step-card').nth(3).scrollIntoViewIfNeeded();
    const scene = page.locator('.application-scene[data-scene="evidence"]');
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('data-demo-playback', 'playing');
    await expect(scene.locator('.application-demo-cursor')).toBeVisible();
    for (const phase of [0, 1, 2, 3]) {
      await expect(scene).toHaveAttribute('data-demo-phase', String(phase));
      await expect(scene.locator('.application-certificate-title')).toHaveText(locale.certificate);
      await expect(scene.locator('.application-tls-service[data-demo-service="443"]')).toHaveText(
        '443 / HTTPS',
      );
      await expect(scene.locator('.application-certificate dl dd')).toHaveText([
        'node-1.example.com',
        locale.issuer,
      ]);
      await expect(scene.locator('.application-validity time')).toHaveCount(2);
      await expect(scene.locator('.application-validity time').first()).toHaveAttribute(
        'datetime',
        '2026-10-01',
      );
      await expect(scene.locator('.application-validity time').last()).toHaveAttribute(
        'datetime',
        '2027-01-01',
      );
      await expect(scene.locator('[data-demo-target="tls-names"]')).toContainText(
        'node-1.example.com',
      );
      await expect(scene.locator('.application-status')).toHaveText('TLS 1.3');
      await expect(scene.locator('.application-fingerprint')).toHaveCount(0);
      await expect(scene).not.toContainText(/OpenSSH|SSH-2\.0|CVE-\d{4}-\d+/);
      await expectReadableContents(scene, 11.5, true);
    }
    expect(errors).toEqual([]);
  });

  for (const width of [320, 390, 1440]) {
    for (const theme of ['light', 'dark'] as const) {
      const variant = `${locale.language} ${width}px ${theme}`;

      test(`five application research scenes remain readable and localized: ${variant}`, async ({
        page,
      }) => {
        await openHome(page, locale.route, theme, width);
        const scenes = [
          ['query', '.application-query-title', locale.query],
          ['results', '.application-results-all', locale.results],
          ['host', '.application-host-services-title', locale.services],
          ['evidence', '.application-certificate-title', locale.certificate],
          ['suggestions', '.application-refine-heading', locale.applied],
        ];
        for (const [name, selector, text] of scenes) {
          await test.step(name!, async () => {
            const card = page
              .locator('.step-card')
              .nth(scenes.findIndex((scene) => scene[0] === name));
            await card.scrollIntoViewIfNeeded();
            const scene = card.locator(`.application-scene[data-scene="${name}"]`);
            await expectApplicationScene(scene);
            await expect(scene.locator(selector!)).toBeVisible();
            if (name === 'host') {
              await expect(scene.locator(selector!)).toContainText(text!);
              await expect(scene.locator(`${selector} > span`)).toHaveText('100');
            } else await expect(scene.locator(selector!)).toHaveText(text!, { useInnerText: true });
            await expectReadableContents(scene, 11.5, true);
            if (name === 'query')
              await expect(scene.locator('[data-demo-query]')).toHaveText('nginx');
            if (name === 'host') {
              await expect(scene).toContainText('192.0.2.10');
              await expect(scene).toContainText('node-1.example.com');
              await expect(scene).toContainText('nginx');
              await expect(scene).toContainText('HTTP/1.1 200 OK');
            }
            if (name === 'results') {
              const addresses = await scene
                .locator('.application-result-address:visible')
                .allTextContents();
              expect(addresses).toHaveLength(2);
              expect(addresses[0]).toBe('192.0.2.10');
              expect(addresses[1]).toMatch(/^(192\.0\.2|198\.51\.100|203\.0\.113)\.144$/);
              for (const address of addresses)
                expect(address).toMatch(/^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d+$/);
            }
            if (name === 'evidence') {
              await expect(scene).toContainText('node-1.example.com');
              await expect(scene).toContainText(locale.issuer);
              await expect(scene).toContainText('TLS 1.3');
              await expect(scene).not.toContainText(/OpenSSH|SSH-2\.0|CVE-\d{4}-\d+/);
            }
          });
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        ).toBeLessThanOrEqual(1);
      });

      // The intermediate phone width also covers the compact research-scene breakpoint.
      // API and closing retain their existing endpoint coverage below.
      if (width === 390) continue;

      test(`application API credentials and quotas remain readable without a live request: ${variant}`, async ({
        page,
      }) => {
        const requests: string[] = [];
        page.on('request', (request) => {
          if (['fetch', 'xhr'].includes(request.resourceType())) requests.push(request.url());
        });
        await openHome(page, locale.route, theme, width);
        const frame = page.locator('.api-demo-frame');
        await frame.scrollIntoViewIfNeeded();
        const demo = frame.locator('.application-scene[data-scene="api"]');
        await expectApplicationScene(demo);
        await expect(demo.locator('.application-api__heading')).toHaveText(locale.apiHeading);
        await expect(demo.locator('.application-api__tabs > span:visible')).toHaveCount(2);
        await expect(demo.locator('[data-demo-target="api-key"]')).toHaveText(/^•{16}$/);
        await expect(demo.locator('[data-demo-target="api-url"]')).toHaveCount(0);
        const keyPanel = demo.locator('[data-api-panel="key"]');
        await expect(keyPanel).toBeVisible();
        await expect(demo.locator('[data-api-panel="usage"]')).toBeHidden();
        const summary = keyPanel.locator('.application-api__summary');
        await expect(summary.locator('dl > div')).toHaveCount(3);
        await expect(demo.locator('[role="meter"]:visible')).toHaveCount(0);
        const usagePanel = demo.locator('[data-api-panel="usage"]');
        const meters = usagePanel.locator('[role="meter"]');
        await expect(meters).toHaveCount(2);
        const number = new Intl.NumberFormat(locale.language);
        for (const [index, [current, maximum]] of [
          [1240500, 1500000],
          [327680, 327680],
        ].entries()) {
          await expect(meters.nth(index)).toHaveAttribute('aria-valuenow', String(current));
          await expect(meters.nth(index)).toHaveAttribute('aria-valuemax', String(maximum));
          await expect(meters.nth(index)).toHaveAttribute(
            'aria-label',
            new RegExp(`^${locale.quotas[index]!.split(' ').join('\\s+')}$`),
          );
          if (index === 0)
            await expect(summary.locator('dd').nth(1)).toHaveText(number.format(current!));
          const balance = usagePanel.locator('.application-api__credit').nth(index);
          await expect(balance.locator('.application-api__credit-value > span').first()).toHaveText(
            number.format(current!),
          );
          await expect(balance.locator('.application-api__credit-total')).toContainText(
            number.format(maximum!),
          );
          const ratio = await meters.nth(index).evaluate((track) => {
            const fill = track.querySelector('.application-api__credit-fill')!;
            return fill.getBoundingClientRect().width / track.getBoundingClientRect().width;
          });
          expect(
            Math.abs(ratio - current! / maximum!),
            'quota fill matches the displayed balance',
          ).toBeLessThan(0.015);
        }
        await expect(demo).not.toContainText(/Revenue Transactions|\/v1\/datasets/);
        await expectReadableContents(demo);
        if (width >= 1200) {
          const top = await page.locator('.api-copy h2').boundingBox();
          const screen = await frame.boundingBox();
          expect(
            Math.abs(screen!.y - top!.y),
            'API screen shares the heading top edge',
          ).toBeLessThanOrEqual(1);
        }
        const copyGaps = await page.locator('.api-copy').evaluate((copy) => {
          const blocks = [...copy.children].map((element) => element.getBoundingClientRect());
          return blocks.slice(1).map((block, index) => block.top - blocks[index]!.bottom);
        });
        expect(
          Math.max(...copyGaps),
          'API copy keeps bounded space between its content and action',
        ).toBeLessThanOrEqual(32);
        expect(requests, 'illustrations must not execute an API request').toEqual([]);
      });

      test(`closing action and footer communicate their language without clipping: ${variant}`, async ({
        page,
      }) => {
        await openHome(page, locale.route, theme, width);
        const closing = page.locator('.closing-section');
        await closing.scrollIntoViewIfNeeded();
        const heading = closing.getByRole('heading', {
          level: 2,
          name: locale.closing,
          exact: true,
        });
        const action = closing.getByRole('link', { name: locale.action, exact: true });
        await expect(heading).toBeVisible();
        await expect(action).toBeVisible();
        // Font glyphs can extend beyond a heading's line box without being clipped.
        await expectReadableContents(heading, 24, false);
        await expectReadableContents(closing.locator('.closing-scene'), 9.5);
        const surface = closing.locator('.search-chrome');
        await expect(surface).toHaveCSS('mask-image', 'none');
        await expect(surface).toHaveCSS('z-index', '0');
        await expectReadableContents(action, 13.5);
        const destination = new URL((await action.getAttribute('href'))!, page.url());
        expect(destination.protocol).toBe('https:');
        expect(destination.pathname).toMatch(/\/search$/);
        await action.focus();
        await expect(action).toBeFocused();

        const footer = page.locator('.footer-columns');
        await footer.scrollIntoViewIfNeeded();
        const localizedLinks = footer.locator(
          'a[href$="/about"], a[href$="/responsible-scanning"], a[href*="/legal/"]',
        );
        await expect(localizedLinks).toHaveCount(8);
        const localeRoot = new URL(page.url()).pathname.replace(/\/?$/, '/');
        for (const link of await localizedLinks.all()) {
          await expect(link.locator('abbr')).toHaveCount(0);
          const target = new URL((await link.getAttribute('href'))!, page.url());
          const route = target.pathname.match(/\/(about|responsible-scanning|legal\/[^/]+)$/);
          expect(route, 'footer links retain their authored destination').not.toBeNull();
          expect(target.pathname, 'footer navigation preserves the selected language').toBe(
            `${localeRoot}${route![1]}`,
          );
          await expectReadableContents(link, 9.5);
        }
        const translatedContact = footer.locator('a[href$="/contact"]');
        await expect(translatedContact.locator('abbr')).toHaveCount(0);
        if (locale.language !== 'en')
          await expect(translatedContact).toHaveAttribute(
            'href',
            new RegExp(`/${locale.language.toLowerCase()}/contact$`),
          );
      });
    }
  }
}
