import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import type { TestContext } from 'node:test';
import { collectTranslationSources, missingTranslations } from '../translation-coverage.ts';

function fixture(t: TestContext, files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'apcosys-translations-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
  return collectTranslationSources(root);
}

test('a newly authored UI message fails until every locale has a translation', (t) => {
  const sources = fixture(t, { 'src/View.tsx': `const View = () => <Text>New feature</Text>;` });
  assert.deepEqual(
    sources.map(({ message }) => message),
    ['New feature'],
  );
  assert.match(
    missingTranslations(sources, { ru: { 'New feature': 'Новая функция' }, 'zh-Hant': {} }).join(
      '\n',
    ),
    /zh-Hant missing UI message/,
  );
  assert.deepEqual(
    missingTranslations(sources, {
      ru: { 'New feature': 'Новая функция' },
      'zh-Hant': { 'New feature': '新功能' },
    }),
    [],
  );
});

test('translated labels include both conditional branches and preserve meaningful whitespace', (t) => {
  const sources = fixture(t, {
    'src/View.tsx': `const label = t(busy ? 'Opening…' : 'Continue'); const price = t(' / month'); const View = () => <Text>\n  Read the\n  guide.\n</Text>;`,
  });
  assert.deepEqual(
    new Set(sources.map(({ message }) => message)),
    new Set(['Opening…', 'Continue', ' / month', 'Read the guide.']),
  );
});

test('technical examples and catalogs are not guessed as messages; legal UI is checked', (t) => {
  const sources = fixture(t, {
    'src/View.tsx': `const selector = '.foo'; const View = () => <Text>Read <code>HTTP/1.1</code><span data-typography="verbatim">nginx</span><input value="technical value" /><span>the guide</span></Text>;`,
    'src/pages/LegalPages.tsx': 'const label = t("Print document");',
    'src/i18n/translations/ru.ts': 'const value = t("Do not scan catalogs");',
  });
  assert.deepEqual(
    new Set(sources.map(({ message }) => message)),
    new Set(['Read ', 'the guide', 'Print document']),
  );
});

test('fragments and authored string children are covered without expanding dynamic records', (t) => {
  const sources = fixture(t, {
    'src/View.tsx': `const View = () => <Text><>{'Read more'}</><Other>Own renderer</Other>{record.value}</Text>; const hint = t('Copy ' + 'request');`,
  });
  assert.deepEqual(
    sources.map(({ message }) => message),
    ['Read more', 'Copy request'],
  );
});

test('translated page-template props require copy, never routes or asset identifiers', (t) => {
  const sources = fixture(t, {
    'src/View.tsx': `const View = () => <PageFrame title="A new page" artwork="technical" sections={[{label: 'Coverage', id: 'coverage'}]} closing={{title: 'Continue', description: 'Next steps'}} links={[linkTo('Get started', '/platform')]}><ReadingRows items={[{title: 'Observation', text: 'Read the evidence', detail: 'Example only'}]} /><Notice>Illustrative data only</Notice></PageFrame>;`,
  });
  assert.deepEqual(
    new Set(sources.map(({ message }) => message)),
    new Set([
      'A new page',
      'Coverage',
      'Continue',
      'Next steps',
      'Get started',
      'Observation',
      'Read the evidence',
      'Example only',
      'Illustrative data only',
    ]),
  );
});

test('translated plan record fields are required without treating identifiers or numeric allowances as copy', (t) => {
  const sources = fixture(t, {
    'src/content/plans.ts': `export const plans = [{ id: 'free', name: 'FREE', description: 'Personal introduction', action: 'Start Free', searchFilters: 'Basic', credits: 500, api: false }];`,
  });
  assert.deepEqual(
    new Set(sources.map(({ message }) => message)),
    new Set(['FREE', 'Personal introduction', 'Start Free', 'Basic']),
  );
  assert.match(
    missingTranslations(sources, { ru: {}, 'zh-Hant': {} }).join('\n'),
    /missing UI message: "Basic"/,
  );
});

test('dynamic contact topics cannot silently fall back to English in selects or email drafts', (t) => {
  const sources = fixture(t, {
    'src/pages/corporate/contactTopics.ts': `export const topics = ['Other', 'Billing & invoices', 'A newly added topic'] as const; const route = '/contact';`,
  });
  assert.deepEqual(
    new Set(sources.map(({ message }) => message)),
    new Set(['Other', 'Billing & invoices', 'A newly added topic']),
  );
  const failures = missingTranslations(sources, {
    ru: { Other: 'Другое', 'Billing & invoices': 'Оплата и счета' },
    'zh-Hant': { Other: '其他', 'Billing & invoices': '帳單與發票' },
  });
  assert.equal(failures.length, 2);
  assert.ok(failures.every((failure) => failure.includes('A newly added topic')));
});
