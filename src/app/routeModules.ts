import { siteRoutes, type RouteGroup } from '../content/routes';
import { getLocale } from './paths';
import { loadLegalDocuments } from '../i18n/legal-documents';

/** Warm the exact lazy route before replacing the currently visible page. */
export const loadHome = () => import('../pages/HomePage');
export const loadPlatform = () => import('../pages/PlatformPages');
export const loadResearch = () => import('../pages/ResearchPages');
export const loadCommercial = () => import('../pages/CommercialPages');
export const loadDocumentation = () => import('../pages/ApiDocumentationPage');
export const loadLegal = () => import('../pages/LegalPages');
export const loadCorporate = () => import('../pages/CorporatePages');
export const loadInvestors = () => import('../pages/corporate/InvestorsPage');
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
  documentation: loadDocumentation,
  corporate: loadCorporate,
  investors: loadInvestors,
  notFound: loadNotFound,
} satisfies Record<RouteGroup | 'notFound', () => Promise<unknown>>;
const pending = new Map<string, Promise<unknown>>();
export function prepareRoute(path: string) {
  if (!pending.has(path)) {
    const group = routeGroup(path);
    const request =
      group === 'legal'
        ? Promise.all([loaders[group](), loadLegalDocuments(getLocale())])
        : loaders[group]();
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
