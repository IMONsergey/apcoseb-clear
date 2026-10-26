import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import ts from 'typescript';

export interface TranslationSource {
  message: string;
  file: string;
  line: number;
}

const verbatimElements = new Set([
  'code',
  'pre',
  'kbd',
  'samp',
  'textarea',
  'input',
  'svg',
  'script',
  'style',
]);
const translatedChildren = new Set(['Text', 'LocaleText', 'Notice']);
// Only props whose existing renderer translates their text are included. IDs,
// hrefs, artwork names, code, and arbitrary data records are not message keys.
const translatedProps: Readonly<Record<string, readonly string[]>> = {
  PageFrame: ['title', 'description', 'sections', 'closing', 'links', 'heroLinks'],
  PageAction: ['links'],
  EditorialHeading: ['title', 'intro'],
  EditorialSection: ['title', 'intro', 'media'],
  ReadingRows: ['items'],
  FeatureColumns: ['items'],
  RelatedReading: ['items'],
  AnimatedDetails: ['title'],
  Modal: ['title'],
  ApiDocsSection: ['title'],
  DocCode: ['label'],
};
const translatedRecordFields = new Set([
  'title',
  'description',
  'text',
  'intro',
  'detail',
  'label',
  'alt',
]);
// PlanCard and the comparison renderer translate these authored fields. The
// explicit source contract prevents a missing Basic/Extended-style data value
// from passing simply because the renderer calls t(plan.searchFilters).
const translatedDataFields: Readonly<Record<string, readonly string[]>> = {
  'src/content/plans.ts': ['name', 'description', 'action', 'searchFilters'],
  'src/content/api-documentation.ts': ['title', 'description', 'label'],
  'src/components/product/investigationDemo.ts': ['tag', 'heading', 'context'],
};
// Contact topics are translated in selects and generated email text. Their
// values are source keys even though the renderer calls t(topic) dynamically.
const translatedDataArrays: Readonly<Record<string, readonly string[]>> = {
  'src/pages/corporate/contactTopics.ts': ['topics'],
};

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.[jt]sx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')
        ? [file]
        : [];
  });
}

function staticStrings(node: ts.Expression | undefined): string[] {
  if (!node) return [];
  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node))
    return staticStrings(node.expression);
  if (ts.isConditionalExpression(node))
    return [...staticStrings(node.whenTrue), ...staticStrings(node.whenFalse)];
  if (ts.isBinaryExpression(node)) {
    const left = staticStrings(node.left),
      right = staticStrings(node.right);
    if (node.operatorToken.kind === ts.SyntaxKind.PlusToken)
      return left.flatMap((a) => right.map((b) => a + b));
    if (
      [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
        node.operatorToken.kind,
      )
    )
      return [...left, ...right];
  }
  return [];
}

// React's JSX whitespace rules differ from a plain trim/replace: spaces inside
// one line are authored text, while indentation between lines is not.
function jsxText(text: string): string {
  const lines = text.split(/\r\n|\n|\r/);
  let lastNonEmpty = 0;
  lines.forEach((line, index) => {
    if (/[^ \t]/.test(line)) lastNonEmpty = index;
  });
  return lines
    .map((line, index) => {
      let value = line.replace(/\t/g, ' ');
      if (index > 0) value = value.replace(/^ +/, '');
      if (index < lines.length - 1) value = value.replace(/ +$/, '');
      return value ? value + (index < lastNonEmpty ? ' ' : '') : '';
    })
    .join('');
}

function isVerbatim(opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement): boolean {
  return opening.attributes.properties.some(
    (attribute) =>
      ts.isJsxAttribute(attribute) &&
      attribute.name.getText() === 'data-typography' &&
      attribute.initializer &&
      ts.isStringLiteral(attribute.initializer) &&
      attribute.initializer.text === 'verbatim',
  );
}

/** Required authored messages; dynamic expressions require browser acceptance. */
export function collectTranslationSources(root = process.cwd()): TranslationSource[] {
  const messages: TranslationSource[] = [];
  for (const file of sourceFiles(resolve(root, 'src'))) {
    const name = relative(root, file).split(sep).join('/');
    if (name.startsWith('src/i18n/translations/')) continue;
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const add = (message: string, node: ts.Node) => {
      if (!/\p{L}/u.test(message)) return;
      messages.push({
        message,
        file: name,
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      });
    };
    function propText(expression: ts.Expression): void {
      if (
        ts.isParenthesizedExpression(expression) ||
        ts.isAsExpression(expression) ||
        ts.isNonNullExpression(expression)
      ) {
        propText(expression.expression);
        return;
      }
      for (const message of staticStrings(expression)) add(message, expression);
      if (ts.isArrayLiteralExpression(expression))
        for (const item of expression.elements) propText(item);
      if (ts.isObjectLiteralExpression(expression)) {
        for (const property of expression.properties)
          if (
            ts.isPropertyAssignment(property) &&
            translatedRecordFields.has(property.name.getText(source).replace(/^['"]|['"]$/g, ''))
          )
            propText(property.initializer);
      }
    }
    function textChildren(children: ts.NodeArray<ts.JsxChild>): void {
      for (const child of children) {
        if (ts.isJsxText(child)) add(jsxText(child.text), child);
        else if (ts.isJsxExpression(child))
          for (const message of staticStrings(child.expression)) add(message, child);
        else if (ts.isJsxFragment(child)) textChildren(child.children);
        else if (ts.isJsxElement(child)) {
          const tag = child.openingElement.tagName.getText(source);
          if (/^[a-z]/.test(tag) && !verbatimElements.has(tag) && !isVerbatim(child.openingElement))
            textChildren(child.children);
        }
      }
    }
    function visit(node: ts.Node): void {
      if (
        name === 'src/content/api-documentation.ts' &&
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'field'
      )
        for (const message of staticStrings(node.arguments[2])) add(message, node);
      if (
        ts.isVariableDeclaration(node) &&
        translatedDataArrays[name]?.includes(node.name.getText(source)) &&
        node.initializer
      )
        propText(node.initializer);
      if (
        ts.isPropertyAssignment(node) &&
        translatedDataFields[name]?.includes(node.name.getText(source).replace(/^['"]|['"]$/g, ''))
      )
        for (const message of staticStrings(node.initializer)) add(message, node);
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 't'
      )
        for (const message of staticStrings(node.arguments[0])) add(message, node);
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'linkTo'
      )
        for (const message of staticStrings(node.arguments[0])) add(message, node);
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const props = translatedProps[node.tagName.getText(source)];
        for (const attribute of node.attributes.properties) {
          if (!ts.isJsxAttribute(attribute) || !props?.includes(attribute.name.getText(source)))
            continue;
          if (attribute.initializer && ts.isStringLiteral(attribute.initializer))
            add(attribute.initializer.text, attribute);
          else if (
            attribute.initializer &&
            ts.isJsxExpression(attribute.initializer) &&
            attribute.initializer.expression
          )
            propText(attribute.initializer.expression);
        }
      }
      if (ts.isJsxElement(node)) {
        const tag = node.openingElement.tagName.getText(source);
        if (translatedChildren.has(tag) && !isVerbatim(node.openingElement))
          textChildren(node.children);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return messages.filter(
    (item, index) =>
      messages.findIndex(
        (candidate) =>
          candidate.message === item.message &&
          candidate.file === item.file &&
          candidate.line === item.line,
      ) === index,
  );
}

export function missingTranslations(
  sources: readonly TranslationSource[],
  catalogs: Readonly<Record<string, Readonly<Record<string, string>>>>,
): string[] {
  return Object.entries(catalogs).flatMap(([locale, catalog]) =>
    sources
      .filter(({ message }) => !Object.hasOwn(catalog, message) || !catalog[message]?.trim())
      .map(
        ({ message, file, line }) =>
          `${file}:${line}: ${locale} missing UI message: ${JSON.stringify(message)}`,
      ),
  );
}
