import { siteRoutes } from '../content/routes';

/** Every published route has English, Russian and Traditional Chinese editions. */
export const localizedRoutes = siteRoutes.map(({ path }) => path);

export const hasLocalizedCopy = (route: string): boolean =>
  localizedRoutes.some((path) => path === route);
