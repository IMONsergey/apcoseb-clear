import { siteRoutes, type SitePath } from '../content/routes';
import type { Locale } from '../i18n/messages';
import { hasLocalizedCopy } from '../i18n/localized-routes';

export const siteBase = import.meta.env.BASE_URL.replace(/\/+$/, '');
export const rootedPath = (value: string) => value.replace(/\/+$/, '') || '/';

const localePrefixes: Record<Exclude<Locale, 'en'>, string> = {
  ru: '/ru',
  'zh-Hant': '/zh-hant',
};

export type SiteLocation = {
  locale: Locale;
  routePath: string;
};

function withoutBase(pathname: string): string | null {
  if (siteBase && pathname !== siteBase && !pathname.startsWith(siteBase + '/')) return null;
  return rootedPath(pathname.slice(siteBase.length));
}

export function resolveSiteLocation(pathname: string): SiteLocation | null {
  const localPath = withoutBase(pathname);
  if (!localPath) return null;
  for (const [locale, prefix] of Object.entries(localePrefixes) as [
    Exclude<Locale, 'en'>,
    string,
  ][]) {
    if (localPath === prefix) return { locale, routePath: '/' };
    if (localPath.startsWith(prefix + '/')) {
      return { locale, routePath: rootedPath(localPath.slice(prefix.length)) };
    }
  }
  return { locale: 'en', routePath: localPath };
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  return resolveSiteLocation(window.location.pathname)?.locale ?? 'en';
}

export function isSitePath(value: string): value is SitePath {
  return siteRoutes.some((route) => route.path === value);
}

export function isRouteAvailable(path: string, locale: Locale): path is SitePath {
  const route = siteRoutes.find((item) => item.path === path);
  return Boolean(route && (locale === 'en' || hasLocalizedCopy(route.path)));
}

function splitPath(value: string): { routePath: string; suffix: string } {
  const suffixAt = value.search(/[?#]/);
  const routePath = suffixAt < 0 ? value : value.slice(0, suffixAt);
  return {
    routePath: rootedPath('/' + routePath.replace(/^\/+/, '')),
    suffix: value.slice(routePath.length),
  };
}

/** Build a URL for an equivalent published route without changing its query or hash. */
export function localeHref(path: string, locale: Locale): string | null {
  const { routePath, suffix } = splitPath(path);
  if (!isRouteAvailable(routePath, locale)) return null;
  const prefix = locale === 'en' ? '' : localePrefixes[locale];
  const localizedPath = routePath === '/' ? prefix + '/' : prefix + routePath;
  return siteBase + localizedPath + suffix;
}

/** Pure URL helpers keep page components independent of the navigation lifecycle. */
export function siteHref(path: string): string {
  const { routePath } = splitPath(path);
  const locale = getLocale();
  return localeHref(path, isRouteAvailable(routePath, locale) ? locale : 'en') ?? siteBase + path;
}

export function getRoutePath(): string {
  const resolved = resolveSiteLocation(window.location.pathname);
  return resolved && isRouteAvailable(resolved.routePath, resolved.locale)
    ? resolved.routePath
    : '/404';
}
