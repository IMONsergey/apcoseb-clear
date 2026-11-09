import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adaptPublicApiDocument } from '../../src/lib/public-api-document.ts';
import { compilePublicApiDocument } from '../../src/lib/public-api-compile.ts';
import { loadPublicApiDocument, publicApiSpecMaxBytes } from '../../src/lib/public-api-loader.ts';
import { hydratePublicApiDocument } from '../../src/lib/public-api-view.ts';

const snapshot = readFileSync(
  new URL('../../public/api/client.openapi.json', import.meta.url),
  'utf8',
);
const bundled = hydratePublicApiDocument(
  compilePublicApiDocument(adaptPublicApiDocument(JSON.parse(snapshot) as unknown)),
);
const url = 'https://docs.example.test/client.openapi.json';
const replacement = () => {
  const document = JSON.parse(snapshot) as {
    info: { version: string };
    servers: { url: string }[];
  };
  document.info.version = 'local-loader-test';
  return document;
};

test('unset optional URL uses the bundle immediately without a request', async () => {
  let requests = 0;
  const result = await loadPublicApiDocument({
    bundled,
    fetchDocument: async () => {
      requests++;
      throw new Error('Unexpected network');
    },
  });
  assert.equal(result.document, bundled);
  assert.equal(result.source, 'bundled');
  assert.equal(result.fallback, false);
  assert.equal(requests, 0);
});

test('configured JSON is validated and fetched anonymously without credentials or API keys', async () => {
  let requests = 0;
  const result = await loadPublicApiDocument({
    bundled,
    url,
    fetchDocument: async (destination, options) => {
      requests++;
      assert.equal(destination, url);
      assert.equal(options?.method, 'GET');
      assert.equal(options?.credentials, 'omit');
      assert.equal(options?.referrerPolicy, 'no-referrer');
      assert.equal(options?.redirect, 'error');
      assert.equal(options?.mode, 'cors');
      assert.ok(options?.signal instanceof AbortSignal);
      assert.deepEqual([...new Headers(options?.headers).keys()], ['accept']);
      return Response.json(replacement());
    },
  });
  assert.equal(requests, 1);
  assert.equal(result.source, 'remote');
  assert.equal(result.fallback, false);
  assert.equal(result.document.version, 'local-loader-test');
  assert.deepEqual(
    result.document,
    hydratePublicApiDocument(compilePublicApiDocument(adaptPublicApiDocument(replacement()))),
  );
});

test('remote validation still checks source metadata omitted from the compact view', async () => {
  const document = replacement() as ReturnType<typeof replacement> & {
    paths: Record<string, Record<string, unknown>>;
  };
  const operation = Object.values(document.paths)
    .flatMap((path) => Object.values(path))
    .find(
      (value) =>
        value &&
        typeof value === 'object' &&
        (value as Record<string, unknown>).operationId === 'private-analytics',
    );
  assert.ok(operation);
  Object.assign(operation, { summary: '' });
  const result = await loadPublicApiDocument({
    bundled,
    url,
    fetchDocument: async () => Response.json(document),
  });
  assert.equal(result.document, bundled);
  assert.equal(result.source, 'bundled');
  assert.equal(result.fallback, true);
});

for (const [name, response] of [
  ['unavailable HTTP response', () => new Response('not shown', { status: 503 })],
  [
    'redirect',
    () => new Response('', { status: 302, headers: { Location: 'https://other.example.test/' } }),
  ],
  [
    'HTML page',
    () =>
      new Response('<script>not-executed</script>', { headers: { 'Content-Type': 'text/html' } }),
  ],
  ['invalid JSON', () => new Response('{')],
  ['unrelated valid JSON', () => Response.json({ message: 'Not an OpenAPI document' })],
  ['empty response', () => new Response(null, { status: 204 })],
  ['invalid UTF-8', () => new Response(new Uint8Array([0xc3, 0x28]))],
] as const) {
  test(name + ' retains the exact bundled reference with a fallback state', async () => {
    const result = await loadPublicApiDocument({
      bundled,
      url,
      fetchDocument: async () => response(),
    });
    assert.equal(result.document, bundled);
    assert.equal(result.source, 'bundled');
    assert.equal(result.fallback, true);
  });
}

test('unsupported OpenAPI or changed authentication falls back, not a partial reference', async () => {
  for (const change of [{ openapi: '3.0.3' }, { security: [] }]) {
    const result = await loadPublicApiDocument({
      bundled,
      url,
      fetchDocument: async () => Response.json({ ...replacement(), ...change }),
    });
    assert.equal(result.document, bundled);
    assert.equal(result.fallback, true);
  }
});

test('a remote document cannot change the API origin used by copied key-bearing examples', async () => {
  const document = replacement();
  document.servers = [{ url: 'https://different-api.example.test' }];
  const result = await loadPublicApiDocument({
    bundled,
    url,
    fetchDocument: async () => Response.json(document),
  });
  assert.equal(result.source, 'bundled');
  assert.equal(result.fallback, true);
  assert.equal(result.document.serverUrl, bundled.serverUrl);
});

test('invalid document URL falls back without making a request', async () => {
  let requests = 0;
  const result = await loadPublicApiDocument({
    bundled,
    url: 'https://user:secret@example.test/private.json',
    fetchDocument: async () => {
      requests++;
      return Response.json(replacement());
    },
  });
  assert.equal(requests, 0);
  assert.equal(result.fallback, true);
});

test('declared oversized document is rejected before reading its stream', async () => {
  let reads = 0;
  const body = new ReadableStream<Uint8Array>(
    {
      pull() {
        reads++;
      },
    },
    { highWaterMark: 0 },
  );
  const result = await loadPublicApiDocument({
    bundled,
    url,
    fetchDocument: async () =>
      new Response(body, { headers: { 'Content-Length': String(publicApiSpecMaxBytes + 1) } }),
  });
  assert.equal(result.document, bundled);
  assert.equal(reads, 0);
});

test('actual streamed size is bounded even if Content-Length is absent', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(publicApiSpecMaxBytes + 1));
    },
    cancel() {
      cancelled = true;
    },
  });
  const result = await loadPublicApiDocument({
    bundled,
    url,
    fetchDocument: async () => new Response(body),
  });
  assert.equal(result.document, bundled);
  assert.equal(result.fallback, true);
  assert.equal(cancelled, true);
});

test('timeout aborts the pending fetch and retains the bundled document', async () => {
  let requestSignal: AbortSignal | null | undefined;
  const result = await loadPublicApiDocument({
    bundled,
    url,
    timeoutMs: 5,
    fetchDocument: async (_destination, options) => {
      requestSignal = options?.signal;
      return new Promise<Response>(() => undefined);
    },
  });
  assert.equal(result.document, bundled);
  assert.equal(result.fallback, true);
  assert.equal(requestSignal?.aborted, true);
});

test('a late response after timeout cannot replace the already-returned fallback', async () => {
  let release!: (response: Response) => void;
  const result = await loadPublicApiDocument({
    bundled,
    url,
    timeoutMs: 5,
    fetchDocument: async () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  });
  assert.equal(result.document, bundled);
  release(Response.json(replacement()));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(result.document, bundled);
  assert.equal(result.source, 'bundled');
});

test('caller cancellation before retrieval does not make a request', async () => {
  const controller = new AbortController();
  controller.abort();
  let requests = 0;
  await assert.rejects(
    loadPublicApiDocument({
      bundled,
      url,
      signal: controller.signal,
      fetchDocument: async () => {
        requests++;
        return Response.json(replacement());
      },
    }),
    { name: 'AbortError' },
  );
  assert.equal(requests, 0);
});

test('navigation cancellation propagates abort instead of announcing a fallback', async () => {
  const controller = new AbortController();
  let requestSignal: AbortSignal | null | undefined;
  const pending = loadPublicApiDocument({
    bundled,
    url,
    signal: controller.signal,
    fetchDocument: async (_destination, options) => {
      requestSignal = options?.signal;
      return new Promise<Response>(() => undefined);
    },
  });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(requestSignal?.aborted, true);
});
