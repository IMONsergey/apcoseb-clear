import { formatTypography, setTypographyLocale } from './typography';

export type Locale = 'en' | 'ru' | 'zh-Hant';
export type MessageValues = Record<string, string | number>;

type Catalog = Record<string, string>;
type CatalogModule = { default: Catalog };

const catalogs: Partial<Record<Locale, Catalog>> = { en: {} };
const pending = new Map<Locale, Promise<Catalog>>();
const pluralRules = new Map<Locale, Intl.PluralRules>();

const loaders: Record<Exclude<Locale, 'en'>, () => Promise<CatalogModule>> = {
  ru: () => import('./translations/ru'),
  'zh-Hant': () => import('./translations/zh-Hant'),
};

function isCatalog(value: unknown): value is Catalog {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((message) => typeof message === 'string')
  );
}

/** Load and activate a catalog before React renders the corresponding document. */
export async function loadLocale(locale: Locale): Promise<void> {
  if (locale === 'en') {
    setTypographyLocale('en');
    return;
  }
  let request = pending.get(locale);
  if (!request) {
    request = loaders[locale]().then((module) => {
      if (!isCatalog(module.default)) throw new Error(`Invalid ${locale} translation catalog.`);
      catalogs[locale] = module.default;
      return module.default;
    });
    pending.set(locale, request);
  }
  setTypographyLocale(locale, await request);
}

export function translate(locale: Locale, source: string, values: MessageValues = {}): string {
  const catalog = catalogs[locale];
  let template = catalog?.[source] ?? source;
  // Optional CLDR variants keep grammatical forms with the translated message.
  // Existing messages and the English source fallback retain their current behavior.
  if (typeof values.count === 'number' && Number.isFinite(values.count)) {
    let rules = pluralRules.get(locale);
    if (!rules) {
      rules = new Intl.PluralRules(locale);
      pluralRules.set(locale, rules);
    }
    template = catalog?.[`${source}#${rules.select(values.count)}`] ?? template;
  }
  const message = template.replace(/\{(\w+)\}/g, (token, name: string) =>
    String(values[name] ?? token),
  );
  return formatTypography(message, locale);
}
