import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Marked } from 'marked';
import prettier from 'prettier';

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
interface Heading {
  id: string;
  title: string;
  level: number;
}

interface LegalDocument {
  title: string;
  updated: string;
  updatedISO: string;
  sourceUrl: string;
  sourceSha256: string;
  headings: Heading[];
  html: string;
}

const documents: Record<string, LegalDocument> = {};
for (const slug of slugs) {
  const source = await readFile(`docs/legal-sources/${slug}.md`, 'utf8');
  // Comments are deliberately unpublished in the source; do not resurrect them.
  const clean = source.replace(/<!--[\s\S]*?-->/g, '');
  const date = clean.match(/_Last updated: (.*?)_/);
  const title = clean.match(/^# (.+)/);
  if (!date || !title) throw new Error(`Missing source metadata: ${slug}`);
  const content = clean
    .replace(/^# .+\n+/, '')
    .replace(/_Last updated: .*?_\n+/, '')
    .replace(/^## Table of Contents\n[\s\S]*?(?=^## |$(?![\s\S]))/m, '');
  const updated = date[1];
  const documentTitle = title[1];
  if (!updated || !documentTitle) throw new Error(`Missing source metadata: ${slug}`);
  const ids = new Set<string>();
  const headings: Heading[] = [];
  const marked = new Marked({
    renderer: {
      html() {
        throw new Error(`Unexpected raw HTML in ${slug}`);
      },
      image() {
        throw new Error(`Unexpected image in ${slug}`);
      },
      heading({ tokens, depth, text }) {
        if (depth < 2 || depth > 3) throw new Error(`Unexpected heading level: ${slug}`);
        const id = slugify(text);
        if (ids.has(id)) throw new Error(`Duplicate anchor: ${slug}#${id}`);
        ids.add(id);
        headings.push({ id, title: text, level: depth });
        return `<h${depth} id="${id}" tabindex="-1">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, tokens }) {
        if (!/^(https:\/\/|mailto:|#)/.test(href)) throw new Error(`Unexpected link: ${href}`);
        const internal = href.match(/^https:\/\/apcosys.net(\/legal\/[^#/?]+)(.*)$/);
        let targetHref = href;
        if (internal) {
          const legalPath = internal[1];
          const suffix = internal[2];
          const targetSlug = legalPath?.split('/').pop();
          if (!legalPath || suffix === undefined || !targetSlug || !slugs.includes(targetSlug)) {
            throw new Error('Unknown legal route');
          }
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
  if (typeof html !== 'string') throw new Error(`Unexpected asynchronous render: ${slug}`);
  documents['/legal/' + slug] = {
    title: documentTitle,
    updated,
    updatedISO: new Date(updated + ' UTC').toISOString().slice(0, 10),
    sourceUrl: 'https://apcosys.net/legal/' + slug,
    sourceSha256: createHash('sha256').update(source).digest('hex'),
    headings,
    html,
  };
}
const target = 'src/content/legal-documents.json';
const compiled = await prettier.format(JSON.stringify(documents), { parser: 'json' });
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')) !== compiled)
    throw new Error('Legal content is stale. Run npm run legal:compile.');
} else await writeFile(target, compiled);
console.log(`Verified ${slugs.length} complete legal documents from preserved sources.`);
