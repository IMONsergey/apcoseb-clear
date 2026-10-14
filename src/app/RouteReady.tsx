import { useLayoutEffect, type ReactNode } from 'react';
import { markRouteReady } from './routeReadiness';

/** Place inside Suspense so a fallback never reports the destination as ready. */
export function RouteReady({ path, children }: { path: string; children: ReactNode }) {
  useLayoutEffect(() => markRouteReady(path), [path]);
  return children;
}
