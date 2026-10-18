import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import ts from 'typescript';
import { loadLocale, translate, type Locale } from '../src/i18n/messages';
import { hasLocalizedCopy } from '../src/i18n/localized-routes';
import { localizedMetadataSource } from '../src/i18n/route-metadata';

interface CommonJsModule {
  exports: unknown;
}

interface SiteRoute {
  path: string;
  title: string;
  description: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSiteRoute(value: unknown): value is SiteRoute {
  return (
    isRecord(value) &&
    typeof value.path === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string'
  );
}

function isSiteRoutes(value: unknown): value is SiteRoute[] {
  return Array.isArray(value) && value.every(isSiteRoute);
}

const source = await readFile(resolve('src/content/routes.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const routeModule: CommonJsModule = { exports: {} };
const legalModule: CommonJsModule = { exports: {} };
const legalCompiled = ts.transpileModule(
  await readFile(resolve('src/content/legal-routes.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
new Function('exports', 'module', legalCompiled)(legalModule.exports, legalModule);
new Function('exports', 'module', 'require', compiled)(
  routeModule.exports,
  routeModule,
  (specifier: string): unknown => {
    if (specifier !== './legal-routes') {
      throw new Error(`Unexpected route-manifest dependency: ${specifier}`);
    }
    return legalModule.exports;
  },
);
const routesValue = isRecord(routeModule.exports) ? routeModule.exports.siteRoutes : undefined;
if (
  !isSiteRoutes(routesValue) ||
  !routesValue.length ||
  new Set(routesValue.map((route) => route.path)).size !== routesValue.length ||
  !routesValue.every(
    (route) =>
      /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(route.path) && route.title && route.description,
  )
)
  throw new Error('Route manifest must contain unique safe paths, titles and descriptions');
const routes = routesValue;
const dist = resolve('dist');
const template = await readFile(join(dist, 'index.html'), 'utf8');
const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const replaceMeta = (html: string, attribute: string, key: string, value: string): string => {
  const selector = new RegExp(
    '(<meta\\s+' + attribute + '="' + key + '"\\s+content=")[^"]*(")',
    'i',
  );
  if (!selector.test(html)) throw new Error('Missing metadata ' + key);
  return html.replace(
    selector,
    (_match: string, before: string, after: string) => before + escape(value) + after,
  );
};
const origin = process.env.APCO_PUBLIC_SITE_ORIGIN?.replace(/\/+$/, '') ?? '';
if (origin) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) {
    throw new Error(
      'APCO_PUBLIC_SITE_ORIGIN requires an HTTPS origin without a path or credentials',
    );
  }
}
const base = (template.match(/<script[^>]*\bsrc="(\/[^"]*?)assets\//)?.[1] ?? '/').replace(
  /\/$/,
  '',
);
const localizedPath = (path: string, locale: Locale): string => {
  const prefix = locale === 'en' ? '' : locale === 'ru' ? '/ru' : '/zh-hant';
  return (base || '') + (path === '/' ? prefix + '/' : prefix + path);
};
const locales: readonly Locale[] = ['en', 'ru', 'zh-Hant'];
let generated = 0;
for (const locale of locales) {
  await loadLocale(locale);
  for (const route of routes) {
    if (locale !== 'en' && !hasLocalizedCopy(route.path)) continue;
    const localized = locale === 'en' ? null : localizedMetadataSource(route.path);
    const title =
      route.path === '/' && locale === 'en'
        ? 'Apcosys — Start with a query.'
        : (localized ? translate(locale, localized.title) : route.title) + ' | Apcosys';
    const description = localized ? translate(locale, localized.description) : route.description;
    let html = template.replace(/<html\s+lang="[^"]*"/, `<html lang="${locale}"`);
    html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escape(title) + '</title>');
    html = replaceMeta(html, 'name', 'description', description);
    html = replaceMeta(html, 'property', 'og:title', title);
    html = replaceMeta(html, 'property', 'og:description', description);
    const canonicalPath = localizedPath(route.path, locale);
    if (origin) {
      const links = [
        '    <link rel="canonical" href="' + escape(origin + canonicalPath) + '" />',
        '    <meta property="og:url" content="' + escape(origin + canonicalPath) + '" />',
      ];
      if (hasLocalizedCopy(route.path)) {
        for (const alternate of [...locales, 'x-default'] as const) {
          const targetLocale = alternate === 'x-default' ? 'en' : alternate;
          links.push(
            '    <link rel="alternate" hreflang="' +
              alternate +
              '" href="' +
              escape(origin + localizedPath(route.path, targetLocale)) +
              '" data-apco-hreflang />',
          );
        }
      }
      html = html.replace('</head>', links.join('\n') + '\n  </head>');
    }
    const relativePath = localizedPath(route.path, locale).slice(base.length).replace(/^\//, '');
    const target = join(dist, relativePath, 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html);
    generated++;
  }
}
await loadLocale('en');
let notFound = template.replace(/<title>[^<]*<\/title>/, '<title>Page not found | Apcosys</title>');
notFound = replaceMeta(notFound, 'name', 'description', 'Find what you need on Apcosys.');
notFound = replaceMeta(notFound, 'property', 'og:title', 'Page not found | Apcosys');
notFound = replaceMeta(notFound, 'property', 'og:description', 'Find what you need on Apcosys.');
await writeFile(join(dist, '404.html'), notFound);
console.log(
  'Generated localized static title, description and Open Graph metadata for',
  generated,
  'routes. Runtime rendering remains client-side.',
);
