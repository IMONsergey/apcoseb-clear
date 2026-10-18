import type { SitePath } from '../content/routes';

/** Marketing routes with client-supplied translations in both additional languages. */
export const localizedRoutes = [
  '/',
  '/platform/search-investigation',
  '/platform/data-methodology',
  '/platform/monitoring',
  '/use-cases/bug-bounty',
  '/use-cases/vulnerability-research',
  '/use-cases/osint-threat-investigation',
  '/teams',
  '/developers/api',
  '/pricing',
  '/contact',
] as const satisfies readonly SitePath[];

export const hasLocalizedCopy = (route: string): boolean =>
  (localizedRoutes as readonly string[]).includes(route);
