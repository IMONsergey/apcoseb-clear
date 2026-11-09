import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deploymentSettings } from '../helpers/public-settings';
import { publicApiSpecTimeoutMs } from '../../src/lib/public-api-policy';

const snapshot = readFileSync(
  new URL('../../public/api/client.openapi.json', import.meta.url),
  'utf8',
);
const configuredUrl = deploymentSettings.apiSpecUrl;

function transportChunk() {
  const manifest = JSON.parse(
    readFileSync(new URL('../../dist/.vite/manifest.json', import.meta.url), 'utf8'),
  ) as Record<string, { file: string; isDynamicEntry?: boolean }>;
  const entry = manifest['src/lib/public-api-loader.ts'];
  if (!entry?.isDynamicEntry) throw new Error('The optional transport must be a dynamic entry.');
  return (url: URL) => url.pathname.endsWith('/' + entry.file);
}

function latch() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

async function holdTransport(page: Page) {
  const held = latch();
  let started!: (url: string) => void;
  const requested = new Promise<string>((resolve) => {
    started = resolve;
  });
  await page.route(transportChunk(), async (route) => {
    started(route.request().url());
    await held.promise;
    await route.continue().catch(() => undefined);
  });
  return { requested, release: held.release };
}

async function documentFetchCounter(page: Page, url: string) {
  await page.addInitScript((expectedUrl: string) => {
    const probe = Object.assign(window, { __apcoDocumentFetchInvocations: 0 });
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (...args: Parameters<typeof window.fetch>) => {
      const input = args[0];
      const destination =
        typeof input === 'string' ? input : 'url' in input ? input.url : input.href;
      if (destination === expectedUrl) probe.__apcoDocumentFetchInvocations++;
      return nativeFetch(...args);
    };
  }, new URL(url).href);
  return () =>
    page.evaluate(() => {
      const count = (window as Window & { __apcoDocumentFetchInvocations?: number })
        .__apcoDocumentFetchInvocations;
      if (typeof count !== 'number') throw new Error('The document fetch probe was not installed.');
      return count;
    });
}

test('bundled public API documentation does not load the optional transport', async ({ page }) => {
  test.skip(Boolean(configuredUrl), 'This case verifies the unset optional-source configuration.');
  const matchesTransport = transportChunk();
  const requests: string[] = [];
  page.on('request', (request) => {
    if (matchesTransport(new URL(request.url()))) requests.push(request.url());
  });
  await page.goto('./developers/api/docs');
  await expect(page.locator('.api-docs__endpoint-list a')).toHaveCount(8);
  await expect(page.locator('[data-document-source]')).toContainText(
    'Showing the bundled reference.',
  );
  await page.evaluate(() => Promise.resolve());
  expect(requests).toEqual([]);
});

test.describe('configured public API document', () => {
  test.skip(!configuredUrl, 'Run the documented optional-source fixture configuration.');

  test('transport chunk failure ends checking without requesting the remote document', async ({
    page,
  }) => {
    const fetchInvocations = await documentFetchCounter(page, configuredUrl!);
    let documentRequests = 0;
    await page.route(configuredUrl!, (route) => {
      documentRequests++;
      return route.fulfill({ contentType: 'application/json', body: snapshot });
    });
    await page.route(transportChunk(), (route) => route.abort());
    await page.goto('./developers/api/docs', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-document-source]')).toContainText(
      'The configured document is unavailable or incompatible.',
    );
    await expect(page.locator('[data-document-source]')).toHaveAttribute(
      'data-document-source',
      'bundled',
    );
    await expect(page.locator('.api-docs__endpoint-list a')).toHaveCount(8);
    expect(await fetchInvocations()).toBe(0);
    expect(documentRequests).toBe(0);
  });

  test('transport chunk timeout retains the bundle and a late import never starts a fetch', async ({
    page,
  }) => {
    await page.clock.install();
    const fetchInvocations = await documentFetchCounter(page, configuredUrl!);
    let documentRequests = 0;
    await page.route(configuredUrl!, (route) => {
      documentRequests++;
      return route.fulfill({ contentType: 'application/json', body: snapshot });
    });
    const chunk = await holdTransport(page);
    try {
      await page.goto('./developers/api/docs', { waitUntil: 'domcontentloaded' });
      const url = await chunk.requested;
      await expect(page.locator('.api-docs__endpoint-list a')).toHaveCount(8);
      await expect(page.locator('[data-document-source]')).toContainText(
        'Checking the configured document',
      );
      await page.clock.fastForward(publicApiSpecTimeoutMs + 1);
      await expect(page.locator('[data-document-source]')).toContainText(
        'The configured document is unavailable or incompatible.',
      );
      chunk.release();
      await page.evaluate(async (moduleUrl) => {
        await import(moduleUrl);
      }, url);
      expect(await fetchInvocations()).toBe(0);
      expect(documentRequests).toBe(0);
      await expect(page.locator('[data-document-source]')).toHaveAttribute(
        'data-document-source',
        'bundled',
      );
    } finally {
      chunk.release();
    }
  });

  test('one deadline covers both delayed transport loading and the remote JSON request', async ({
    page,
  }) => {
    await page.clock.install();
    const fetchInvocations = await documentFetchCounter(page, configuredUrl!);
    const chunk = await holdTransport(page);
    const requested = latch();
    const response = latch();
    const completed = latch();
    await page.route(configuredUrl!, async (route) => {
      requested.release();
      await response.promise;
      await route
        .fulfill({ contentType: 'application/json', body: snapshot })
        .catch(() => undefined);
      completed.release();
    });
    try {
      await page.goto('./developers/api/docs', { waitUntil: 'domcontentloaded' });
      await chunk.requested;
      await page.clock.fastForward(publicApiSpecTimeoutMs / 2);
      chunk.release();
      await requested.promise;
      expect(await fetchInvocations()).toBe(1);
      await page.clock.fastForward(publicApiSpecTimeoutMs / 2 + 1);
      // A fresh five-second transport timeout would still be checking at this point.
      await expect(page.locator('[data-document-source]')).toContainText(
        'The configured document is unavailable or incompatible.',
        { timeout: 1000 },
      );
      response.release();
      await completed.promise;
      expect(await fetchInvocations()).toBe(1);
      await expect(page.locator('[data-document-source]')).toHaveAttribute(
        'data-document-source',
        'bundled',
      );
    } finally {
      chunk.release();
      response.release();
    }
  });

  test('unmount before the transport chunk resolves prevents fetch and late UI updates', async ({
    page,
  }) => {
    const fetchInvocations = await documentFetchCounter(page, configuredUrl!);
    let documentRequests = 0;
    await page.route(configuredUrl!, (route) => {
      documentRequests++;
      return route.fulfill({ contentType: 'application/json', body: snapshot });
    });
    const chunk = await holdTransport(page);
    try {
      await page.goto('./developers/api/docs', { waitUntil: 'domcontentloaded' });
      const url = await chunk.requested;
      await page.locator('.api-docs__back').click();
      await expect(page).toHaveURL(/\/developers\/api$/);
      await expect(page.locator('.api-docs')).toHaveCount(0);
      chunk.release();
      await page.evaluate(async (moduleUrl) => {
        await import(moduleUrl);
      }, url);
      expect(await fetchInvocations()).toBe(0);
      expect(documentRequests).toBe(0);
      await expect(page).toHaveURL(/\/developers\/api$/);
      await expect(page.locator('.api-docs')).toHaveCount(0);
    } finally {
      chunk.release();
    }
  });

  test('valid replacement updates version and schema while examples remain text-only', async ({
    page,
  }) => {
    const source = JSON.parse(snapshot);
    source.info.version = 'mock-browser-replacement';
    source.components.schemas.SearchRequest.properties.page.description =
      'Mock replacement page field.';
    const calls: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).hostname === 'api.apcosys.net') calls.push(request.url());
    });
    await page.route(configuredUrl!, (route) => {
      expect(route.request().headers()['x-api-key']).toBeUndefined();
      expect(route.request().headers().cookie).toBeUndefined();
      expect(route.request().headers().referer).toBeUndefined();
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(source) });
    });
    await page.goto('./developers/api/docs?keep=context#host-details');
    await expect(page.locator('[data-document-source]')).toHaveAttribute(
      'data-document-source',
      'remote',
    );
    await expect(page.locator('[data-document-version]')).toHaveAttribute(
      'data-document-version',
      'mock-browser-replacement',
    );
    await expect(page.locator('#search-hosts')).toContainText('Mock replacement page field.');
    await expect(page).toHaveURL(
      (url) => url.searchParams.get('keep') === 'context' && url.hash === '#host-details',
    );
    expect(calls).toEqual([]);
  });

  for (const failure of [
    'unavailable',
    'invalid',
    'changed-authentication',
    'changed-api-origin',
    'additional-root-server',
    'path-server-override',
    'operation-server-override',
    'projection-budget',
  ] as const) {
    test(
      failure + ' document preserves every bundled endpoint and localized fallback notice',
      async ({ page }) => {
        const source = JSON.parse(snapshot);
        if (failure === 'changed-authentication') source.security = [];
        if (failure === 'changed-api-origin')
          source.servers = [{ url: 'https://other.example.test' }];
        if (failure === 'additional-root-server')
          source.servers.push({ url: 'https://other.example.test' });
        if (failure === 'path-server-override')
          source.paths['/api/v1/search/hosts'].servers = [{ url: 'https://other.example.test' }];
        if (failure === 'operation-server-override')
          source.paths['/api/v1/search/hosts'].post.servers = [
            { url: 'https://api.apcosys.net/alternate-base' },
          ];
        if (failure === 'projection-budget') {
          const definitions = source.components.schemas;
          const original = definitions.SearchRequest;
          definitions.GuardDag0 = {
            type: 'object',
            properties: { budget_probe: { type: 'string' } },
          };
          for (let level = 1; level <= 14; level++) {
            const ref = '#/components/schemas/GuardDag' + (level - 1);
            definitions['GuardDag' + level] = { allOf: [{ $ref: ref }, { $ref: ref }] };
          }
          definitions.SearchRequest = {
            allOf: [original, { $ref: '#/components/schemas/GuardDag14' }],
          };
        }
        await page.route(configuredUrl!, (route) =>
          route.fulfill({
            status: failure === 'unavailable' ? 503 : 200,
            contentType: 'application/json',
            body: failure === 'invalid' ? '{"invalid":true}' : JSON.stringify(source),
          }),
        );
        await page.goto('./ru/developers/api/docs#private-search');
        await expect(page.locator('[data-document-source]')).toHaveAttribute(
          'data-document-source',
          'bundled',
        );
        await expect(page.locator('[data-document-source]')).toContainText(
          'Настроенный документ недоступен или несовместим.',
        );
        await expect(page.locator('.api-docs__endpoint-list a')).toHaveCount(8);
        await expect(page.locator('#private-search')).toBeInViewport();
        await expect(page.locator('.api-docs h1')).toHaveText('Документация API.');
      },
    );
  }

  test('navigation away aborts loading without returning to the documentation route', async ({
    page,
  }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(configuredUrl!, async (route) => {
      await held;
      await route
        .fulfill({ contentType: 'application/json', body: snapshot })
        .catch(() => undefined);
    });
    await page.goto('./developers/api/docs', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-document-source]')).toContainText(
      'Checking the configured document',
    );
    await expect(page.locator('.api-docs__endpoint-list a')).toHaveCount(8);
    await page.locator('.api-docs__back').click();
    release();
    await expect(page).toHaveURL(/\/developers\/api$/);
    await expect(page.locator('.api-docs')).toHaveCount(0);
  });
});
