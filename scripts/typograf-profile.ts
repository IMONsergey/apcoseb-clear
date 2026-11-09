import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { normalizePath, type Plugin } from 'vite';

export const TYPOGRAF_PROFILE = {
  version: '7.8.0',
  dependencySha256: '02215a7c10adc14078c90b7a444e4149579f5081aaeea96679f6523c3c63d1fb',
  policySha256: '5868b657bce0197cf4cea4f63e77504210f91e2524238eda0dd11141831e336e',
  ordinaryRules: 107,
  innerRules: 6,
  excludedHandlers: 71,
} as const;

// This allowlist is specific to the reviewed dependency and private application policy.
// Keep registrations and all metadata; only unreachable ordinary function bodies change.
export const EXCLUDED_RULES: readonly string[] = [
  'common/html/e-mail',
  'common/html/escape',
  'common/html/nbr',
  'common/html/p',
  'common/html/processingAttrs',
  'common/html/quot',
  'common/html/stripTags',
  'common/html/url',
  'common/nbsp/afterNumber',
  'common/nbsp/afterParagraphMark',
  'common/nbsp/afterSectionMark',
  'common/nbsp/beforeShortLastNumber',
  'common/nbsp/dpi',
  'common/nbsp/nowrap',
  'common/number/digitGrouping',
  'common/number/fraction',
  'common/number/mathSigns',
  'common/number/times',
  'common/other/delBOM',
  'common/other/repeatWord',
  'common/space/delLeadingBlanks',
  'common/space/delTrailingBlanks',
  'common/space/insertFinalNewline',
  'common/symbols/arrow',
  'common/symbols/cf',
  'common/symbols/copy',
  'ru/dash/centuries',
  'ru/dash/daysMonth',
  'ru/dash/de',
  'ru/dash/decade',
  'ru/dash/directSpeech',
  'ru/dash/izpod',
  'ru/dash/izza',
  'ru/dash/ka',
  'ru/dash/koe',
  'ru/dash/month',
  'ru/dash/surname',
  'ru/dash/taki',
  'ru/dash/time',
  'ru/dash/to',
  'ru/dash/kakto',
  'ru/dash/weekday',
  'ru/dash/years',
  'ru/date/fromISO',
  'ru/date/weekday',
  'ru/money/currency',
  'ru/money/ruble',
  'ru/nbsp/addr',
  'ru/nbsp/beforeParticle',
  'ru/nbsp/centuries',
  'ru/nbsp/m',
  'ru/nbsp/ooo',
  'ru/nbsp/page',
  'ru/nbsp/ps',
  'ru/nbsp/see',
  'ru/nbsp/years',
  'ru/number/comma',
  'ru/number/ordinals',
  'ru/optalign/bracket',
  'ru/optalign/comma',
  'ru/optalign/quote',
  'ru/other/accent',
  'ru/other/phone-number',
  'ru/punctuation/ano',
  'ru/punctuation/exclamation',
  'ru/punctuation/exclamationQuestion',
  'ru/punctuation/hellipQuestion',
  'ru/space/afterHellip',
  'ru/space/year',
  'ru/symbols/NN',
  'ru/typo/switchingKeyboardLayout',
];

const unreachable =
  "function __apcoDisabledTypographyRule() { throw new Error('Disabled typography rule reached.'); }\n";
const replacementBody = '{ return __apcoDisabledTypographyRule(); }';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function requireProfile(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('Typograf profile: ' + message);
}

function parse(source: string, name: string, kind = ts.ScriptKind.JS): ts.SourceFile {
  const file = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, kind);
  const diagnostics = (file as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
    .parseDiagnostics;
  requireProfile(diagnostics.length === 0, 'syntax changed in ' + name);
  return file;
}

function property(object: ts.ObjectLiteralExpression, name: string): ts.PropertyAssignment {
  const result = object.properties.find(
    (item): item is ts.PropertyAssignment =>
      ts.isPropertyAssignment(item) && item.name.getText() === name,
  );
  requireProfile(result, 'missing property ' + name);
  return result;
}

function inspect(source: string) {
  const file = parse(source, 'typograf.es.mjs');
  const definitions = new Map<string, ts.Expression>();
  const ordinary: string[] = [];
  const inner: string[] = [];
  for (const statement of file.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const item of statement.declarationList.declarations) {
        if (ts.isIdentifier(item.name) && item.initializer) {
          definitions.set(item.name.text, item.initializer);
        }
      }
    }
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression))
      continue;
    const call = statement.expression;
    const target = call.expression;
    if (
      !ts.isPropertyAccessExpression(target) ||
      target.expression.getText(file) !== 'Typograf' ||
      !['addRules', 'addInnerRules'].includes(target.name.text)
    )
      continue;
    const values = call.arguments[0];
    requireProfile(
      call.arguments.length === 1 && values && ts.isArrayLiteralExpression(values),
      'registration shape changed',
    );
    for (const value of values.elements) {
      requireProfile(ts.isIdentifier(value), 'registration is not a named declaration');
      (target.name.text === 'addRules' ? ordinary : inner).push(value.text);
    }
  }
  requireProfile(ordinary.length === TYPOGRAF_PROFILE.ordinaryRules, 'ordinary rule count changed');
  requireProfile(inner.length === TYPOGRAF_PROFILE.innerRules, 'inner rule count changed');
  requireProfile(
    new Set(ordinary).size === ordinary.length && new Set(inner).size === inner.length,
    'duplicate registration',
  );
  requireProfile(!inner.some((name) => ordinary.includes(name)), 'ordinary/inner alias changed');
  const selected = new Set(EXCLUDED_RULES);
  const edits: {
    name: string;
    variable: string;
    start: number;
    end: number;
    original: string;
    signature: string;
  }[] = [];
  const retained = new Map<string, string>();
  for (const variable of [...ordinary, ...inner]) {
    const object = definitions.get(variable);
    requireProfile(object, 'missing declaration ' + variable);
    if (!ts.isObjectLiteralExpression(object)) {
      requireProfile(
        variable === 'mainRule$1' &&
          object.getText(file) ===
            "__assign(__assign({}, mainRule$2), { name: 'en-GB/dash/main' })",
        'unexpected derived rule',
      );
      retained.set(variable, object.getText(file));
      continue;
    }
    const nameValue = property(object, 'name').initializer;
    const name = ts.isIdentifier(nameValue) ? definitions.get(nameValue.text) : nameValue;
    requireProfile(name && ts.isStringLiteral(name), 'nonliteral rule name');
    const handler = property(object, 'handler').initializer;
    if (inner.includes(variable) || !selected.has(name.text)) {
      retained.set(variable, handler.getText(file));
      continue;
    }
    requireProfile(!inner.includes(variable), 'excluded inner rule');
    requireProfile(
      ts.isFunctionExpression(handler) && !handler.asteriskToken && !handler.modifiers?.length,
      'excluded initializer is not a plain function',
    );
    edits.push({
      name: name.text,
      variable,
      start: handler.body.getStart(file),
      end: handler.body.end,
      original: handler.body.getText(file),
      signature: source.slice(handler.getStart(file), handler.body.getStart(file)),
    });
  }
  requireProfile(
    edits.length === TYPOGRAF_PROFILE.excludedHandlers &&
      new Set(edits.map((item) => item.name)).size === selected.size,
    'excluded allowlist changed',
  );
  const references = new Map(edits.map((item) => [item.variable, 0]));
  function visit(node: ts.Node) {
    if (ts.isIdentifier(node) && references.has(node.text)) {
      references.set(node.text, references.get(node.text)! + 1);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  requireProfile(
    [...references.values()].every((count) => count === 2),
    'rule callback reference escaped registration',
  );
  edits.sort((a, b) => a.start - b.start);
  return { ordinary, inner, edits, retained };
}

export function transformTypograf(source: string) {
  requireProfile(hash(source) === TYPOGRAF_PROFILE.dependencySha256, 'dependency bytes changed');
  requireProfile(!source.includes('__apcoDisabledTypographyRule'), 'guard name collision');
  const before = inspect(source);
  let cursor = 0;
  let code = unreachable;
  const ranges: { start: number; end: number; original: string }[] = [];
  for (const edit of before.edits) {
    code += source.slice(cursor, edit.start);
    ranges.push({
      start: code.length,
      end: code.length + replacementBody.length,
      original: edit.original,
    });
    code += replacementBody;
    cursor = edit.end;
  }
  code += source.slice(cursor);
  let inverse = code;
  for (const range of [...ranges].reverse()) {
    requireProfile(
      inverse.slice(range.start, range.end) === replacementBody,
      'replacement range mismatch',
    );
    inverse = inverse.slice(0, range.start) + range.original + inverse.slice(range.end);
  }
  requireProfile(inverse.startsWith(unreachable), 'guard prefix mismatch');
  inverse = inverse.slice(unreachable.length);
  requireProfile(inverse === source, 'inverse reconstruction failed');
  const after = inspect(code);
  requireProfile(
    JSON.stringify(before.ordinary) === JSON.stringify(after.ordinary) &&
      JSON.stringify(before.inner) === JSON.stringify(after.inner),
    'registry order changed',
  );
  requireProfile(
    JSON.stringify([...before.retained]) === JSON.stringify([...after.retained]),
    'retained callback or derived rule changed',
  );
  requireProfile(
    before.edits.every((item, index) => item.signature === after.edits[index]?.signature),
    'excluded function signature changed',
  );
  return {
    code,
    proof: {
      version: TYPOGRAF_PROFILE.version,
      inputSha256: hash(source),
      outputSha256: hash(code),
      inverseSha256: hash(inverse),
      ordinaryRules: before.ordinary.length,
      innerRules: before.inner.length,
      excludedHandlers: before.edits.length,
      retainedDeclarations: before.retained.size,
      excluded: before.edits.map(({ name, variable, start, end, original }) => ({
        name,
        variable,
        start,
        end,
        originalSha256: hash(original),
      })),
      retained: [...before.retained].map(([variable, bytes]) => ({
        variable,
        sha256: hash(bytes),
      })),
    },
  };
}

type Operation = { method: 'enableRule' | 'disableRule'; rules: string | string[] };
export function readPolicy(source: string) {
  requireProfile(
    hash(source) === TYPOGRAF_PROFILE.policySha256,
    'private application policy changed',
  );
  const file = parse(source, 'typography.ts', ts.ScriptKind.TS);
  const engine = file.statements.find(
    (node): node is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(node) && node.name?.text === 'typographyEngine',
  );
  requireProfile(engine?.body, 'private engine function missing');
  const english = engine.body.statements.find(
    (node): node is ts.IfStatement =>
      ts.isIfStatement(node) && node.expression.getText(file) === "locale === 'en'",
  );
  requireProfile(english && ts.isBlock(english.thenStatement), 'English policy branch changed');
  function operations(statements: ts.NodeArray<ts.Statement>, expectedLocale: string) {
    const constructors: ts.NewExpression[] = [];
    const result: Operation[] = [];
    for (const statement of statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.name.text === 'engine') {
            requireProfile(
              declaration.initializer && ts.isNewExpression(declaration.initializer),
              'engine constructor changed',
            );
            constructors.push(declaration.initializer);
          }
        }
      }
      if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression))
        continue;
      const call = statement.expression;
      const target = call.expression;
      if (!ts.isPropertyAccessExpression(target) || target.expression.getText(file) !== 'engine')
        continue;
      requireProfile(
        target.name.text === 'enableRule' || target.name.text === 'disableRule',
        'unexpected engine policy call',
      );
      const value = call.arguments[0];
      requireProfile(call.arguments.length === 1 && value, 'policy call arguments changed');
      let rules: string | string[];
      if (ts.isStringLiteral(value)) rules = value.text;
      else {
        requireProfile(ts.isArrayLiteralExpression(value), 'nonliteral policy rule list');
        rules = value.elements.map((item) => {
          requireProfile(ts.isStringLiteral(item), 'nonliteral policy rule');
          return item.text;
        });
      }
      result.push({ method: target.name.text, rules });
    }
    const constructor = constructors[0];
    requireProfile(
      constructors.length === 1 &&
        constructor &&
        constructor.expression.getText(file) === 'Typograf',
      'constructor identity changed',
    );
    requireProfile(
      constructor.arguments?.length === 1 &&
        constructor.arguments[0]?.getText(file) === "{ locale: '" + expectedLocale + "' }",
      'constructor hooks or preferences changed',
    );
    requireProfile(
      result[0]?.method === 'disableRule' && result[0].rules === '*',
      'disable-all must precede every policy',
    );
    return { locale: expectedLocale, operations: result };
  }
  return [
    operations(english.thenStatement.statements, 'en-US'),
    operations(engine.body.statements, 'ru'),
  ];
}

export type ProfileRule = Record<string, unknown> & {
  name: string;
  handler: (...args: unknown[]) => unknown;
};
export type ProfileEngine = {
  execute(text: string): string;
  enableRule(value: string | string[]): void;
  disableRule(value: string | string[]): void;
  isEnabledRule(name: string): boolean;
  settings: unknown;
  enabledRules: unknown;
};
export type ProfileConstructor = {
  new (preferences: { locale: string }): ProfileEngine;
  version: string;
  getRules(): ProfileRule[];
  getInnerRules(): ProfileRule[];
  getLocales(): string[];
  getData(name: string): unknown;
};

export function verifyStockPolicy(Typograf: ProfileConstructor, policy: string) {
  requireProfile(Typograf.version === TYPOGRAF_PROFILE.version, 'stock engine version changed');
  requireProfile(
    Typograf.getRules().length === TYPOGRAF_PROFILE.ordinaryRules &&
      Typograf.getInnerRules().length === TYPOGRAF_PROFILE.innerRules,
    'stock registry changed',
  );
  for (const profile of readPolicy(policy)) {
    const engine = new Typograf({ locale: profile.locale });
    for (const operation of profile.operations) engine[operation.method](operation.rules);
    requireProfile(
      EXCLUDED_RULES.every((name) => !engine.isEnabledRule(name)),
      'excluded handler is enabled by application policy',
    );
  }
}

function fileId(id: string) {
  return normalizePath(id.split('?')[0]!);
}

export function guardImporter(specifier: string, importer: string | undefined, policyFile: string) {
  if (specifier === 'typograf' || specifier.startsWith('typograf/')) {
    requireProfile(importer && fileId(importer) === policyFile, 'additional application importer');
  }
}

function readInputs(root: string) {
  const policyFile = normalizePath(resolve(root, 'src/i18n/typography.ts'));
  const dependencyFile = normalizePath(
    realpathSync(resolve(root, 'node_modules/typograf/dist/typograf.es.mjs')),
  );
  const policy = readFileSync(policyFile, 'utf8');
  const source = readFileSync(dependencyFile, 'utf8');
  readPolicy(policy);
  requireProfile(
    hash(source) === TYPOGRAF_PROFILE.dependencySha256,
    'installed dependency changed',
  );
  let importerCount = 0;
  function walk(directory: string) {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, item.name);
      requireProfile(!item.isSymbolicLink(), 'unexpected application source symlink');
      if (item.isDirectory()) walk(path);
      else if (/\.[cm]?[jt]sx?$/.test(item.name)) {
        const file = parse(
          readFileSync(path, 'utf8'),
          path,
          item.name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
        function visit(node: ts.Node) {
          const value =
            ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
              ? node.moduleSpecifier
              : ts.isCallExpression(node) &&
                  (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                    node.expression.getText(file) === 'require')
                ? node.arguments[0]
                : undefined;
          if (
            value &&
            ts.isStringLiteral(value) &&
            (value.text === 'typograf' || value.text.startsWith('typograf/'))
          ) {
            guardImporter(value.text, normalizePath(path), policyFile);
            importerCount++;
          }
          ts.forEachChild(node, visit);
        }
        visit(file);
      }
    }
  }
  walk(resolve(root, 'src'));
  requireProfile(importerCount === 1, 'application importer count changed');
  return { policyFile, dependencyFile, policy, source };
}

export function typografProfile(root: string): Plugin {
  let input: ReturnType<typeof readInputs> | undefined;
  let transformations = 0;
  return {
    name: 'apcosys-pinned-typograf-profile',
    apply: 'build',
    enforce: 'pre',
    async buildStart() {
      input = readInputs(root);
      const stock = (await import(pathToFileURL(input.dependencyFile).href)) as {
        default: ProfileConstructor;
      };
      verifyStockPolicy(stock.default, input.policy);
    },
    resolveId(specifier, importer) {
      if (input) guardImporter(specifier, importer, input.policyFile);
      return null;
    },
    transform(code, id) {
      if (!input || fileId(id) !== input.dependencyFile) return null;
      requireProfile(
        normalizePath(id) === input.dependencyFile,
        'unexpected dependency module variant',
      );
      const transformed = transformTypograf(code);
      transformations++;
      return { code: transformed.code, map: null };
    },
    generateBundle() {
      requireProfile(input && transformations === 1, 'profile was not applied exactly once');
      const dependencyModules = [...this.getModuleIds()].filter((id) =>
        fileId(id).includes('/node_modules/typograf/'),
      );
      requireProfile(
        dependencyModules.length === 1 && fileId(dependencyModules[0]!) === input.dependencyFile,
        'unexpected Typograf client graph',
      );
      const info = this.getModuleInfo(input.dependencyFile);
      requireProfile(
        info &&
          info.importers.length === 1 &&
          fileId(info.importers[0]!) === input.policyFile &&
          info.dynamicImporters.length === 0,
        'engine import escaped private policy',
      );
      const current = readInputs(root);
      requireProfile(
        current.source === input.source && current.policy === input.policy,
        'inputs changed during build',
      );
    },
  };
}
