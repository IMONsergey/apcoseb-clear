import ru from '../src/i18n/translations/ru';
import zhHant from '../src/i18n/translations/zh-Hant';
import { localizedMetadata } from '../src/i18n/route-metadata';
import { localizedRoutes } from '../src/i18n/localized-routes';
import { languageOptions } from '../src/i18n/language-options';
import { siteRoutes } from '../src/content/routes';

const catalogs = { ru, 'zh-Hant': zhHant } as const;
const failures: string[] = [];

function argumentsIn(text: string): string[] {
  return [...text.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map((match) => match[1]!).sort();
}

for (const language of languageOptions) {
  const canonical = Intl.getCanonicalLocales(language.value)[0];
  if (canonical !== language.value) failures.push(`Noncanonical language tag: ${language.value}`);
}

const allPaths = new Set(siteRoutes.map(({ path }) => path));
for (const path of localizedRoutes) {
  if (!allPaths.has(path)) failures.push(`Missing route: ${path}`);
  if (path.startsWith('/legal/')) failures.push(`Unreviewed legal translation: ${path}`);
  if (!localizedMetadata[path]) failures.push(`Missing localized metadata: ${path}`);
}

for (const [locale, catalog] of Object.entries(catalogs)) {
  for (const [source, translated] of Object.entries(catalog)) {
    if (!source.trim() || !translated.trim()) failures.push(`${locale}: empty message`);
    if (source.trim() !== source && source !== ' / month') {
      failures.push(`${locale}: whitespace in source key: ${source}`);
    }
    if (JSON.stringify(argumentsIn(source)) !== JSON.stringify(argumentsIn(translated))) {
      failures.push(`${locale}: placeholder mismatch: ${source}`);
    }
    if (/\(или |\(或 |\(或者 |\bundefined\b/.test(translated)) {
      failures.push(`${locale}: translation contains an editor alternative: ${source}`);
    }
  }
  for (const [path, metadata] of Object.entries(localizedMetadata)) {
    for (const key of [metadata.title, metadata.description]) {
      if (!(key in catalog))
        failures.push(`${locale}: missing ${path} metadata translation: ${key}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `${localizedRoutes.length} localized marketing routes and ${Object.keys(ru).length}/${Object.keys(zhHant).length} RU/Traditional Chinese messages verified.`,
  );
}
