import { siteRoutes } from '../../src/content/routes';
import { localizedRoutes } from '../../src/i18n/localized-routes';
import type { Locale } from '../../src/i18n/messages';

export const siteVariants: { path: string; locale: Locale; notFound: boolean }[] = [
  ...siteRoutes.map(({ path }) => ({ path, locale: 'en' as const, notFound: false })),
  ...(['ru', 'zh-Hant'] as const).flatMap((locale) =>
    localizedRoutes.map((path) => ({
      path: (locale === 'ru' ? '/ru' : '/zh-hant') + path,
      locale,
      notFound: false,
    })),
  ),
  ...(['en', 'ru', 'zh-Hant'] as const).map((locale) => ({
    path: (locale === 'en' ? '' : locale === 'ru' ? '/ru' : '/zh-hant') + '/missing-a11y-route',
    locale,
    notFound: true,
  })),
];
