import { siteRoutes, type SitePath } from '../content/routes';

export const siteBase = import.meta.env.BASE_URL.replace(/\/+$/, '');
export const rootedPath = (value: string) => value.replace(/\/+$/, '') || '/';

/** Pure URL helpers keep page components independent of the navigation lifecycle. */
export function siteHref(path: string) {
  return siteBase + '/' + path.replace(/^\/+/, '');
}

export function isSitePath(value: string): value is SitePath {
  return siteRoutes.some((route) => route.path === value);
}

export function getRoutePath(): string {
  const pathname = window.location.pathname;
  if (siteBase && pathname !== siteBase && !pathname.startsWith(siteBase + '/')) return '/404';
  const route = rootedPath(pathname.slice(siteBase.length));
  return isSitePath(route) ? route : '/404';
}
