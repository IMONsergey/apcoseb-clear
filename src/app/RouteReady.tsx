import { useLayoutEffect, type ReactNode } from 'react';
import { markRouteReady } from './routeReadiness';

/** Place inside Suspense so a fallback never reports the destination as ready. */
export function RouteReady({
  path,
  children,
  onReady,
}: {
  path: string;
  children: ReactNode;
  onReady?: (path: string) => void;
}) {
  useLayoutEffect(() => {
    const cleanup = markRouteReady(path);
    onReady?.(path);
    return cleanup;
  }, [path, onReady]);
  return children;
}
