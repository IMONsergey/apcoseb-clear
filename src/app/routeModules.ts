import { siteRoutes, type RouteGroup } from '../content/routes';

/** Warm the exact lazy route before replacing the currently visible page. */
export const loadHome = () => import('../pages/HomePage');
export const loadPlatform = () => import('../pages/PlatformPages');
export const loadResearch = () => import('../pages/ResearchPages');
export const loadCommercial = () => import('../pages/CommercialPages');
export const loadLegal = () => import('../pages/LegalPages');
export const loadCorporate = () => import('../pages/CorporatePages');
export const loadNotFound = () => import('../pages/NotFoundPage');

/** One route group, one boundary: no intermediate empty inner-page render. */
export function routeGroup(path: string): RouteGroup | 'notFound' {
  return siteRoutes.find((route) => route.path === path)?.group ?? 'notFound';
}
const loaders = {
  home: loadHome,
  legal: loadLegal,
  platform: loadPlatform,
  research: loadResearch,
  commercial: loadCommercial,
  corporate: loadCorporate,
  notFound: loadNotFound,
} satisfies Record<RouteGroup | 'notFound', () => Promise<unknown>>;
const pending = new Map<string, Promise<unknown>>();
export function prepareRoute(path: string) {
  if (!pending.has(path)) {
    const request = loaders[routeGroup(path)]();
    pending.set(
      path,
      request.catch((error: unknown) => {
        pending.delete(path);
        throw error;
      }),
    );
  }
  return pending.get(path)!;
}
