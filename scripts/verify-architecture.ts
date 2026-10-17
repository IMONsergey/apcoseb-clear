import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

interface ImportEdge {
  from: string;
  to: string;
  runtime: boolean;
}

export interface ArchitectureReport {
  modules: number;
  runtimeImports: number;
  failures: string[];
}

const projectPath = (root: string, file: string): string =>
  relative(root, file).split(sep).join('/');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.[jt]sx?$/.test(file) && !file.endsWith('.d.ts')
        ? [file]
        : [];
  });
}

/** Read the working tree, including new files; Git staging must not affect the gate. */
export function inspectArchitecture(root = process.cwd()): ArchitectureReport {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.app.json'), ts.sys.readFile);
  if (config.error)
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const files = sourceFiles(resolve(root, 'src'));
  const graph = new Map<string, Set<string>>(
    files.map((file) => [projectPath(root, file), new Set<string>()]),
  );
  const failures: string[] = [];
  // Extensionless imports can resolve to the wrong module on case-insensitive systems.
  const moduleNames = new Map<string, string>();
  for (const file of files) {
    const filename = projectPath(root, file);
    const normalized = filename
      .replace(/\.[jt]sx?$/, '')
      .normalize('NFC')
      .toLowerCase();
    const previous = moduleNames.get(normalized);
    if (previous) failures.push(`Ambiguous module names: ${previous} and ${filename}`);
    else moduleNames.set(normalized, filename);
  }
  const allEdges: ImportEdge[] = [];
  for (const file of files) {
    const from = projectPath(root, file);
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    function add(specifier: string, runtime: boolean): void {
      if (!specifier.startsWith('.')) return;
      const module = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule;
      if (!module) return; // TypeScript handles unresolved modules; CSS is outside this graph.
      const to = projectPath(root, module.resolvedFileName);
      allEdges.push({ from, to, runtime });
      if (runtime && graph.has(to)) graph.get(from)?.add(to);
    }
    function visit(node: ts.Node): void {
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        const bindings = clause?.namedBindings;
        const namedTypesOnly =
          !clause?.name &&
          bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.length > 0 &&
          bindings.elements.every((item) => item.isTypeOnly);
        if (ts.isStringLiteralLike(node.moduleSpecifier)) {
          add(node.moduleSpecifier.text, !clause?.isTypeOnly && !namedTypesOnly);
        }
      }
      if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        const bindings = node.exportClause;
        const namedTypesOnly =
          bindings &&
          ts.isNamedExports(bindings) &&
          bindings.elements.length > 0 &&
          bindings.elements.every((item) => item.isTypeOnly);
        if (ts.isStringLiteralLike(node.moduleSpecifier)) {
          add(node.moduleSpecifier.text, !node.isTypeOnly && !namedTypesOnly);
        }
      }
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        add(node.arguments[0].text, true);
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      )
        add(node.argument.literal.text, false);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  // Boundaries apply to type imports as well: shared types belong below consumers.
  for (const { from, to } of allEdges) {
    const shared = /src\/(?:components|hooks|content|config|lib|i18n|theme)\//.test(from);
    if (shared && to.startsWith('src/pages/')) failures.push(`${from} must not import page ${to}`);
    if (
      /^src\/(?:content|config|lib)\//.test(from) &&
      /^src\/(?:app|components|hooks|pages|theme|i18n|visuals)\//.test(to)
    )
      failures.push(`${from} must remain independent of runtime UI (${to})`);
    if (
      from.startsWith('src/components/ui/') &&
      /^src\/components\/(?:layout|product|sections)\//.test(to)
    )
      failures.push(`${from} must not depend on a composed component (${to})`);
    const group = from.match(/^src\/pages\/(corporate|commercial|platform|research)\//)?.[1];
    const other = to.match(/^src\/pages\/(corporate|commercial|platform|research)\//)?.[1];
    if (group && other && group !== other) failures.push(`${from} crosses page groups (${to})`);
  }
  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  function walk(file: string): void {
    if (active.has(file)) {
      failures.push(`Runtime cycle: ${[...stack.slice(stack.indexOf(file)), file].join(' → ')}`);
      return;
    }
    if (visited.has(file)) return;
    visited.add(file);
    active.add(file);
    stack.push(file);
    for (const imported of graph.get(file) ?? []) walk(imported);
    stack.pop();
    active.delete(file);
  }
  for (const file of graph.keys()) walk(file);
  return {
    modules: files.length,
    runtimeImports: [...graph.values()].reduce((sum, edges) => sum + edges.size, 0),
    failures: [...new Set(failures)],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = inspectArchitecture();
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
  else console.log('Import boundaries and runtime cycle checks passed.');
}
