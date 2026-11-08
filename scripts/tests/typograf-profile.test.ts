import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import ru from '../../src/i18n/translations/ru.ts';
import zh from '../../src/i18n/translations/zh-Hant.ts';
import {
  EXCLUDED_RULES,
  TYPOGRAF_PROFILE,
  guardImporter,
  readPolicy,
  transformTypograf,
  verifyStockPolicy,
  type ProfileConstructor,
  type ProfileRule,
} from '../typograf-profile.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const original = readFileSync(join(root, 'node_modules/typograf/dist/typograf.es.mjs'), 'utf8');
const policy = readFileSync(join(root, 'src/i18n/typography.ts'), 'utf8');
const transformed = transformTypograf(original);
type Locale = 'en' | 'ru' | 'zh-Hant';
type PolicyModule = {
  formatTypography(text: string, locale: Locale): string;
  setTypographyLocale(locale: Locale, messages?: Readonly<Record<string, string>>): void;
  typograph(text: string): string;
  noBreakNumber(value: string): string;
};
const dataUrl = (source: string) =>
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
async function loadEngine(source: string) {
  return (await import(dataUrl(source))) as {
    default: ProfileConstructor;
    excludedCallCount?: () => number;
  };
}
async function loadPolicy(source: string): Promise<PolicyModule> {
  const marker = "import Typograf from 'typograf';";
  assert.equal(policy.split(marker).length - 1, 1);
  const bound = policy.replace(
    marker,
    'import Typograf from ' + JSON.stringify(dataUrl(source)) + ';',
  );
  const compiled = ts.transpileModule(bound, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.length ?? 0, 0);
  return (await import(dataUrl(compiled.outputText))) as PolicyModule;
}

function instrument(code: string) {
  const guard =
    "function __apcoDisabledTypographyRule() { throw new Error('Disabled typography rule reached.'); }\n";
  const counter =
    "let __apcoExcludedCalls = 0;\nfunction __apcoDisabledTypographyRule() { __apcoExcludedCalls++; throw new Error('Disabled typography rule reached.'); }\n";
  const tail = '\nexport function excludedCallCount() { return __apcoExcludedCalls; }\n';
  assert.ok(code.startsWith(guard));
  assert.equal(code.split(guard).length - 1, 1);
  const result = counter + code.slice(guard.length) + tail;
  assert.equal(guard + result.slice(counter.length, -tail.length), code);
  return result;
}

test('pinned typography transform preserves registry, signatures and all retained bytes', async () => {
  assert.equal(transformed.proof.inverseSha256, TYPOGRAF_PROFILE.dependencySha256);
  assert.equal(transformed.proof.excludedHandlers, 71);
  assert.equal(transformed.proof.ordinaryRules, 107);
  assert.equal(transformed.proof.innerRules, 6);
  assert.equal(
    new Set(transformed.proof.excluded.map((row) => row.name)).size,
    EXCLUDED_RULES.length,
  );
  const stock = (await loadEngine(original)).default;
  const profiled = (await loadEngine(transformed.code)).default;
  verifyStockPolicy(stock, policy);
  verifyStockPolicy(profiled, policy);
  function metadata(rows: ProfileRule[]) {
    return rows.map(({ handler, ...row }) => ({ ...row, arity: handler.length }));
  }
  assert.deepEqual(metadata(profiled.getRules()), metadata(stock.getRules()));
  assert.deepEqual(metadata(profiled.getInnerRules()), metadata(stock.getInnerRules()));
  assert.deepEqual(profiled.getLocales(), stock.getLocales());
  const stockRules = stock.getRules();
  const profiledRules = profiled.getRules();
  for (let i = 0; i < stockRules.length; i++) {
    for (let j = 0; j < stockRules.length; j++) {
      assert.equal(
        profiledRules[i]!.handler === profiledRules[j]!.handler,
        stockRules[i]!.handler === stockRules[j]!.handler,
      );
    }
  }
  const source = ts.createSourceFile('typograf.es.mjs', original, ts.ScriptTarget.Latest, true);
  const dataKeys = new Set<string>();
  function collectDataKeys(node: ts.Node) {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isStringLiteral(node.name) &&
      /^[\w-]+\/[\w-]+$/.test(node.name.text)
    ) {
      dataKeys.add(node.name.text);
    }
    ts.forEachChild(node, collectDataKeys);
  }
  collectDataKeys(source);
  assert.ok(dataKeys.has('common/quote') && dataKeys.has('ru/char') && dataKeys.has('en-US/char'));
  for (const name of dataKeys) assert.deepEqual(profiled.getData(name), stock.getData(name), name);
  for (const profile of readPolicy(policy)) {
    const left = new stock({ locale: profile.locale });
    const right = new profiled({ locale: profile.locale });
    for (const operation of profile.operations) {
      left[operation.method](operation.rules);
      right[operation.method](operation.rules);
    }
    assert.deepEqual(right.settings, left.settings);
    assert.deepEqual(right.enabledRules, left.enabledRules);
    for (const name of EXCLUDED_RULES) assert.equal(right.isEnabledRule(name), false);
  }
});

test('unknown dependency, policy and importer changes fail closed', () => {
  assert.throws(() => transformTypograf(original + '\n'), /dependency bytes changed/);
  assert.throws(() => readPolicy(policy + '\n'), /private application policy changed/);
  const importer = join(root, 'src/i18n/typography.ts').replaceAll('\\', '/');
  assert.doesNotThrow(() => guardImporter('typograf', importer, importer));
  assert.throws(
    () => guardImporter('typograf', join(root, 'src/new-consumer.ts'), importer),
    /additional application importer/,
  );
  assert.throws(
    () => guardImporter('typograf/dist/typograf.es.mjs', undefined, importer),
    /additional application importer/,
  );
});

test('excluded-handler counter positive control throws and records exactly one call', async () => {
  const control = await loadEngine(
    instrument(transformed.code) + '\n// Separate positive control module.\n',
  );
  const rule = control.default.getRules().find((item) => item.name === EXCLUDED_RULES[0]);
  assert.ok(rule && control.excludedCallCount);
  assert.equal(control.excludedCallCount(), 0);
  assert.throws(() => rule.handler('control'), /Disabled typography rule reached/);
  assert.equal(control.excludedCallCount(), 1);
});

function corpus() {
  const values = new Set<string>();
  const files: string[] = [];
  function strings(value: unknown) {
    if (typeof value === 'string') values.add(value);
    else if (Array.isArray(value)) value.forEach(strings);
    else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        values.add(key);
        strings(item);
      }
    }
  }
  function addFile(path: string) {
    files.push(path.slice(root.length + 1).replaceAll('\\', '/'));
    const text = readFileSync(path, 'utf8');
    if (path.endsWith('.json')) {
      strings(JSON.parse(text) as unknown);
      return;
    }
    const file = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const diagnostics = (file as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
      .parseDiagnostics;
    assert.equal(diagnostics.length, 0, path);
    function visit(node: ts.Node) {
      if (
        ts.isStringLiteralLike(node) ||
        ts.isJsxText(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node)
      ) {
        values.add(node.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
  }
  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      assert.equal(entry.isSymbolicLink(), false);
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(tsx?|json)$/.test(entry.name)) addFile(path);
    }
  }
  walk(join(root, 'src'));
  addFile(join(root, 'public/api/client.openapi.json'));
  for (const required of [
    'src/content/legal-documents.json',
    'src/content/legal-translations/ru.json',
    'src/content/legal-translations/zh-Hant.json',
    'src/i18n/translations/ru.ts',
    'src/i18n/translations/zh-Hant.ts',
    'public/api/client.openapi.json',
  ])
    assert.ok(files.includes(required), required);
  for (const value of [
    '',
    ' ',
    '  leading and trailing  ',
    'Line 1\n\n\nLine 2\tend',
    '"API" -- search... 2 500 credits, 50 USD/year',
    'https://apcosys.net/search?search_value=nginx&run=1',
    'info@apcosys.net',
    '2026-11-08 12:34:56',
    '1.2.3.4:443 / 2001:db8::1',
    'CVE-2026-1234',
    '«Русский "вложенный" текст» -- 50 руб. и 10 коп.',
    '№ 123, А. С. Пушкин, 20 ноября 2026 г.',
    'Условия 1 234 567,89 и 1/2; {count} запросов, {price} за {period}.',
    '<code>"do not change" -- id=12.3</code><p>"Text"... 1 000</p>',
    '<a href="https://apcosys.net/login?return=%2Fsearch">"Sign in"</a>',
    '<pre>curl https://api.apcosys.net/api/v1/search -d \'{"query":"nginx"}\'</pre>',
    '繁體中文「引號」與 API 1 000 次；https://apcosys.net/。',
    '\uF000tf0\uF000 "quote" \u00a0 \u202f \u2009',
  ])
    values.add(value);
  for (const value of [...values]) {
    if (/\{\w+\}/.test(value)) {
      values.add(value.replace(/\{\w+\}/g, '1 250'));
      values.add(value.replace(/\{\w+\}/g, '«API» https://apcosys.net/search?q=x&run=1'));
    }
  }
  return { files, values: [...values] };
}

test('whole current source, legal and API corpus matches stock with zero excluded calls', async (context) => {
  const instrumented = instrument(transformed.code);
  const counter = await loadEngine(instrumented);
  assert.ok(counter.excludedCallCount);
  assert.equal(counter.excludedCallCount(), 0);
  const stock = await loadPolicy(original);
  const profiled = await loadPolicy(transformed.code);
  const counted = await loadPolicy(instrumented);
  const input = corpus();
  let comparisons = 0;
  const catalogs: Record<Locale, Readonly<Record<string, string>>> = { en: {}, ru, 'zh-Hant': zh };
  for (const locale of ['en', 'ru', 'zh-Hant', 'ru', 'en'] as const) {
    stock.setTypographyLocale(locale, catalogs[locale]);
    profiled.setTypographyLocale(locale, catalogs[locale]);
    counted.setTypographyLocale(locale, catalogs[locale]);
    for (const value of input.values) {
      const expected = stock.formatTypography(value, locale);
      assert.equal(profiled.formatTypography(value, locale), expected, locale + ' direct');
      assert.equal(counted.formatTypography(value, locale), expected, locale + ' counted');
      assert.equal(
        profiled.formatTypography(expected, locale),
        stock.formatTypography(expected, locale),
        locale + ' cached/idempotent',
      );
      assert.equal(
        profiled.typograph(value),
        stock.typograph(value),
        locale + ' catalog/active locale',
      );
      assert.equal(counted.typograph(value), stock.typograph(value), locale + ' counted catalog');
      assert.equal(
        profiled.noBreakNumber(value),
        stock.noBreakNumber(value),
        locale + ' technical number',
      );
      comparisons++;
    }
  }
  assert.equal(counter.excludedCallCount(), 0);
  context.diagnostic(
    JSON.stringify({
      sourceFiles: input.files,
      corpusStrings: input.values.length,
      localePasses: 5,
      comparisons,
      excludedCalls: counter.excludedCallCount(),
      transformProof: transformed.proof,
    }),
  );
});
