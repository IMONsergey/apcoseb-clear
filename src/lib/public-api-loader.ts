import { publicApiSpecUrl } from './public-api-url';
import { publicApiSpecMaxBytes, publicApiSpecTimeoutMs } from './public-api-policy';
import { hydratePublicApiDocument, type PublicApiDocumentView } from './public-api-view';

export { publicApiSpecMaxBytes, publicApiSpecTimeoutMs } from './public-api-policy';

export type PublicApiDocumentResult = {
  document: PublicApiDocumentView;
  source: 'bundled' | 'remote';
  fallback: boolean;
};

/** Optional, anonymous document retrieval only. There is no API request execution path. */
export async function loadPublicApiDocument({
  bundled,
  url,
  signal,
  fetchDocument = fetch,
  timeoutMs = publicApiSpecTimeoutMs,
}: {
  bundled: PublicApiDocumentView;
  url?: string;
  signal?: AbortSignal;
  fetchDocument?: typeof fetch;
  timeoutMs?: number;
}): Promise<PublicApiDocumentResult> {
  const fallback = { document: bundled, source: 'bundled' as const, fallback: Boolean(url) };
  if (signal?.aborted) throw new DOMException('Document load cancelled.', 'AbortError');
  if (!url) return fallback;
  const controller = new AbortController();
  const requestSignal = controller.signal;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const stopped = new Promise<never>((_resolve, reject) => {
    requestSignal.addEventListener(
      'abort',
      () => reject(new DOMException('Document load cancelled.', 'AbortError')),
      { once: true },
    );
  });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const retrieve = async (): Promise<PublicApiDocumentResult> => {
    const response = await fetchDocument(publicApiSpecUrl(url), {
      method: 'GET',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      mode: 'cors',
      cache: 'no-cache',
      headers: { Accept: 'application/json, application/vnd.oai.openapi+json' },
      signal: requestSignal,
    });
    if (!response.ok) throw new Error('Public API documentation unavailable.');
    const size = Number(response.headers.get('content-length'));
    if (size > publicApiSpecMaxBytes || !response.body)
      throw new Error('Public API documentation is empty or too large.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    let json = '';
    let complete = false;
    try {
      while (true) {
        if (requestSignal.aborted) throw new DOMException('Cancelled.', 'AbortError');
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > publicApiSpecMaxBytes) throw new Error('Public API document is too large.');
        json += decoder.decode(chunk.value, { stream: true });
      }
      json += decoder.decode();
      complete = true;
    } finally {
      if (!complete) await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    if (requestSignal.aborted) throw new DOMException('Cancelled.', 'AbortError');
    const input = JSON.parse(json) as unknown;
    // Bundled documentation is fully validated at build time. The complete runtime adapter
    // is needed only for optional remote updates; it must never enter the initial route graph.
    const { adaptPublicApiDocument, compilePublicApiDocument } =
      await import('./public-api-document');
    if (requestSignal.aborted) throw new DOMException('Cancelled.', 'AbortError');
    const document = adaptPublicApiDocument(input);
    // A remote documentation edit must not redirect copied API-key examples to another origin.
    // An intentional API-origin migration requires reviewing and replacing the bundled snapshot.
    if (new URL(document.serverUrl).origin !== new URL(bundled.serverUrl).origin)
      throw new Error('The configured document changes the approved API origin.');
    return {
      document: hydratePublicApiDocument(compilePublicApiDocument(document)),
      source: 'remote',
      fallback: false,
    };
  };
  try {
    return await Promise.race([retrieve(), stopped]);
  } catch {
    if (signal?.aborted) throw new DOMException('Document load cancelled.', 'AbortError');
    return fallback;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
    controller.abort();
  }
}
