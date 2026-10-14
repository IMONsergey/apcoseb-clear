import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import ts from 'typescript';

const source = await readFile(resolve('src/content/routes.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
const legalModule = { exports: {} };
const legalCompiled = ts.transpileModule(
  await readFile(resolve('src/content/legal-routes.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
new Function('exports', 'module', legalCompiled)(legalModule.exports, legalModule);
new Function('exports', 'module', 'require', compiled)(module.exports, module, (specifier) => {
  if (specifier !== './legal-routes')
    throw new Error(`Unexpected route-manifest dependency: ${specifier}`);
  return legalModule.exports;
});
const routes = module.exports.siteRoutes;
if (
  !Array.isArray(routes) ||
  !routes.length ||
  new Set(routes.map((route) => route.path)).size !== routes.length ||
  !routes.every(
    (route) =>
      /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(route.path) && route.title && route.description,
  )
)
  throw new Error('Route manifest must contain unique safe paths, titles and descriptions');
const dist = resolve('dist');
const template = await readFile(join(dist, 'index.html'), 'utf8');
const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const replaceMeta = (html, attribute, key, value) => {
  const selector = new RegExp(
    '(<meta\\s+' + attribute + '="' + key + '"\\s+content=")[^"]*(")',
    'i',
  );
  if (!selector.test(html)) throw new Error('Missing metadata ' + key);
  return html.replace(selector, (_, before, after) => before + escape(value) + after);
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
for (const route of routes) {
  const title = route.path === '/' ? 'Apcosys — Start with a query.' : route.title + ' | Apcosys';
  let html = template.replace(/<title>[^<]*<\/title>/, '<title>' + escape(title) + '</title>');
  html = replaceMeta(html, 'name', 'description', route.description);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', route.description);
  const canonicalPath = (base || '') + route.path;
  if (origin) {
    html = html.replace(
      '</head>',
      '    <link rel="canonical" href="' +
        escape(origin + canonicalPath) +
        '" />\n    <meta property="og:url" content="' +
        escape(origin + canonicalPath) +
        '" />\n  </head>',
    );
  }
  const target = join(dist, route.path.replace(/^\//, ''), 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
}
await copyFile(join(dist, 'index.html'), join(dist, '404.html'));
console.log(
  'Generated static title, description and Open Graph metadata for',
  routes.length - 1,
  'inner paths. Runtime rendering remains client-side.',
);
