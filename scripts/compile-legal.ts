import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Marked, type Token, type Tokens } from 'marked';
import prettier from 'prettier';
import type { LegalDocument, LegalDocuments, LegalHeading } from '../src/content/legal-types';

const slugs = [
  'api-data-license-agreement',
  'cookie-policy',
  'data-collection-policy',
  'data-processing-agreement',
  'privacy-policy',
  'terms',
];
const references: Readonly<Record<string, string>> = {
  'API & Data License Agreement': 'api-data-license-agreement',
  'Cookie Policy': 'cookie-policy',
  'Data Collection Policy': 'data-collection-policy',
  'Data Processing Agreement': 'data-processing-agreement',
  'Privacy Policy': 'privacy-policy',
  'Terms and Conditions': 'terms',
  'Terms of Service': 'terms',
  'Политика использования файлов cookie': 'cookie-policy',
  'Соглашение об обработке данных': 'data-processing-agreement',
  'Соглашением об обработке данных': 'data-processing-agreement',
  'Политика конфиденциальности': 'privacy-policy',
  'Политике конфиденциальности': 'privacy-policy',
  'Политикой конфиденциальности': 'privacy-policy',
  'Cookie 政策': 'cookie-policy',
  資料處理協議: 'data-processing-agreement',
  隱私權政策: 'privacy-policy',
};
const escape = (s: string): string =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

function edition(source: string, name: string) {
  // Comments are deliberately unpublished in the source; do not resurrect them.
  const clean = source.replace(/<!--[\s\S]*?-->/g, '').trimStart();
  const updated = clean.match(/_Last updated: (.*?)_/)?.[1];
  const title = clean.match(/^# (.+)/)?.[1];
  if (!updated || !title) throw new Error('Missing source metadata: ' + name);
  const content = clean
    .replace(/^# .+\n+/, '')
    .replace(/_Last updated: .*?_\n+/, '')
    .replace(/^## Table of Contents\n[\s\S]*?(?=^## |$(?![\s\S]))/m, '');
  return { title, updated, content };
}

function structure(tokens: Token[]): unknown[] {
  return tokens
    .filter((token) => token.type !== 'space')
    .map((token): unknown => {
      if (token.type === 'heading') return ['heading', token.depth];
      if (token.type === 'list') {
        const list = token as Tokens.List;
        return ['list', list.ordered, list.start, list.items.map((item) => structure(item.tokens))];
      }
      if (token.type === 'blockquote')
        return ['blockquote', structure((token as Tokens.Blockquote).tokens)];
      return token.type;
    });
}

function invariants(content: string) {
  const marked = new Marked();
  const tokens = marked.lexer(content);
  const links: string[] = [];
  const emphasis: string[] = [];
  marked.walkTokens(tokens, (token) => {
    if (token.type === 'link') links.push(token.href);
    if (token.type === 'strong' || token.type === 'em') emphasis.push(token.type);
  });
  return {
    structure: structure(tokens),
    links: links.sort(),
    emphasis: emphasis.sort(),
    numbers: [...content.matchAll(/\b\d+(?:[./]\d+)*\b/g)].map((match) => match[0]).sort(),
  };
}

function compile(source: string, slug: string, original?: LegalDocument): LegalDocument {
  const { title, updated, content } = edition(source, slug);
  const ids = new Set<string>();
  const headings: LegalHeading[] = [];
  const marked = new Marked({
    renderer: {
      html() {
        throw new Error('Unexpected raw HTML in ' + slug);
      },
      image() {
        throw new Error('Unexpected image in ' + slug);
      },
      heading({ tokens, depth, text }) {
        if (depth < 2 || depth > 3) throw new Error('Unexpected heading level: ' + slug);
        const sourceHeading = original?.headings[headings.length];
        if (original && sourceHeading?.level !== depth)
          throw new Error('Translation heading mismatch: ' + slug);
        const id = sourceHeading?.id ?? slugify(text);
        if (ids.has(id)) throw new Error('Duplicate anchor: ' + slug + '#' + id);
        ids.add(id);
        headings.push({ id, title: text, level: depth });
        return `<h${depth} id="${id}" tabindex="-1">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, tokens }) {
        if (!/^(https:\/\/|mailto:|#)/.test(href)) throw new Error('Unexpected link: ' + href);
        const internal = href.match(/^https:\/\/apcosys.net(\/legal\/[^#/?]+)(.*)$/);
        let targetHref = href;
        if (internal) {
          const legalPath = internal[1];
          const suffix = internal[2];
          const targetSlug = legalPath?.split('/').pop();
          if (!legalPath || suffix === undefined || !targetSlug || !slugs.includes(targetSlug))
            throw new Error('Unknown legal route');
          targetHref = legalPath + suffix;
        }
        return `<a href="${escape(targetHref)}">${this.parser.parseInline(tokens)}</a>`;
      },
      strong({ tokens, text }) {
        const target = references[text];
        const html = this.parser.parseInline(tokens);
        return target && target !== slug
          ? `<strong><a href="/legal/${target}">${html}</a></strong>`
          : `<strong>${html}</strong>`;
      },
    },
  });
  const html = marked.parse(content);
  if (typeof html !== 'string') throw new Error('Unexpected asynchronous render: ' + slug);
  if (original && headings.length !== original.headings.length)
    throw new Error('Missing translation headings: ' + slug);
  return {
    title,
    updated,
    updatedISO: new Date(updated + ' UTC').toISOString().slice(0, 10),
    sourceUrl: 'https://apcosys.net/legal/' + slug,
    sourceSha256: original?.sourceSha256 ?? sha256(source),
    headings,
    html,
    ...(original ? { translationSha256: sha256(source) } : {}),
  };
}

const originals: LegalDocuments = {};
const translations: Record<'ru' | 'zh-Hant', LegalDocuments> = { ru: {}, 'zh-Hant': {} };
for (const slug of slugs) {
  const source = await readFile('docs/legal-sources/' + slug + '.md', 'utf8');
  const original = compile(source, slug);
  const sourceEdition = edition(source, slug);
  originals['/legal/' + slug] = original;
  for (const [locale, documents] of Object.entries(translations)) {
    const filename = 'docs/legal-translations/' + locale + '/' + slug + '.md';
    const translated = await readFile(filename, 'utf8');
    const translatedEdition = edition(translated, filename);
    const recordedHash = translated.match(/<!-- source-sha256: ([a-f0-9]{64}) -->/)?.[1];
    if (recordedHash !== original.sourceSha256)
      throw new Error('Translation source has changed: ' + filename);
    if (translatedEdition.updated !== sourceEdition.updated)
      throw new Error('Translation edition date mismatch: ' + filename);
    const sourceInvariants = invariants(sourceEdition.content);
    const translatedInvariants = invariants(translatedEdition.content);
    for (const key of Object.keys(sourceInvariants) as (keyof typeof sourceInvariants)[]) {
      if (JSON.stringify(sourceInvariants[key]) !== JSON.stringify(translatedInvariants[key]))
        throw new Error('Translation ' + key + ' parity mismatch: ' + filename);
    }
    documents['/legal/' + slug] = compile(translated, slug, original);
  }
}
const outputs: [string, LegalDocuments][] = [
  ['src/content/legal-documents.json', originals],
  ...Object.entries(translations).map(([locale, documents]): [string, LegalDocuments] => [
    'src/content/legal-translations/' + locale + '.json',
    documents,
  ]),
];
if (!process.argv.includes('--check'))
  await mkdir('src/content/legal-translations', { recursive: true });
for (const [target, documents] of outputs) {
  const compiled = await prettier.format(JSON.stringify(documents), { parser: 'json' });
  if (process.argv.includes('--check')) {
    if ((await readFile(target, 'utf8')) !== compiled)
      throw new Error('Legal content is stale: ' + target + '. Run npm run legal:compile.');
  } else await writeFile(target, compiled);
}
console.log(
  'Verified 6 complete English legal sources and 12 translations with source, structure, link and numerical parity.',
);
