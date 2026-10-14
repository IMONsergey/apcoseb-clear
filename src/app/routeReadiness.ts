let committedPath: string | undefined;
const listeners = new Set<() => void>();

/** The route's layout effect reports the committed subtree after Suspense resolves. */
export function markRouteReady(path: string) {
  committedPath = path;
  listeners.forEach((notify) => notify());
  return () => {
    if (committedPath === path) committedPath = undefined;
  };
}

/** One notification, with cancellation and a bounded failure path; no DOM polling. */
export function waitForRouteReady(path: string, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  if (committedPath === path) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (ready: boolean) => {
      clearTimeout(timer);
      listeners.delete(check);
      signal.removeEventListener('abort', abort);
      resolve(ready);
    };
    const check = () => {
      if (committedPath === path) finish(true);
    };
    const abort = () => finish(false);
    const timer = globalThis.setTimeout(() => finish(false), 3000);
    listeners.add(check);
    signal.addEventListener('abort', abort, { once: true });
  });
}
