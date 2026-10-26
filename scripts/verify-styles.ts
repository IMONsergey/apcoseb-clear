import { readdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import postcss from 'postcss';
import type { AtRule, Node } from 'postcss';

const properties = [
  'font-size',
  'line-height',
  'letter-spacing',
  'gap',
  'border-radius',
  'box-shadow',
] as const;
type InventoryProperty = (typeof properties)[number];
type CssSource = readonly [file: string, source: string];

interface StyleInventory {
  files: number;
  mediaQueries: number;
  uniqueMediaConditions: number;
  containerQueries: number;
  rules: number;
  declarations: number;
  bytes: number;
  distinctValues: Record<InventoryProperty, number>;
  colorLiterals: number;
}

const failures: string[] = [];
const sizeSteps = new Set([10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 80]);
const sizeValues = new Set([
  ...[...sizeSteps].map((size) => `var(--font-size-${size})`),
  ...['page', 'section', 'subsection'].map((role) => `var(--type-${role}-size)`),
  'inherit',
]);
const printSizes = new Set(['11pt', '12pt', '14pt', '18pt', '30pt']);
const leadingSteps = new Set(['1', '1.1', '1.25', '1.5', '1.6', '1.7']);
const shadowRoles = new Set(['low', 'popover', 'modal', 'inset', 'accent']);
function isInventoryProperty(value: string): value is InventoryProperty {
  return (properties as readonly string[]).includes(value);
}

function isAtRule(node: Node): node is AtRule {
  return node.type === 'atrule';
}

async function cssFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested: string[][] = await Promise.all(
    entries.map(async (entry) => {
      const path = `${directory}/${entry.name}`;
      if (path === 'src/visuals') return [];
      return entry.isDirectory() ? cssFiles(path) : path.endsWith('.css') ? [path] : [];
    }),
  );
  return nested.flat().sort();
}
function sourceLine(node: Node): number {
  const line = node.source?.start?.line;
  if (!line) throw new Error('Parsed CSS node is missing source location.');
  return line;
}

function inventory(sources: readonly CssSource[], validate: boolean): StyleInventory {
  const values = Object.fromEntries(
    properties.map((property) => [property, new Set<string>()]),
  ) as Record<InventoryProperty, Set<string>>;
  const colors = new Set<string>();
  const mediaConditions = new Set<string>();
  let mediaQueries = 0,
    containerQueries = 0;
  let rules = 0,
    declarations = 0,
    bytes = 0;
  for (const [file, source] of sources) {
    bytes += Buffer.byteLength(source);
    const root = postcss.parse(source, { from: file });
    root.walkAtRules((rule) => {
      if (rule.name === 'media') {
        mediaQueries++;
        mediaConditions.add(rule.params);
      } else if (rule.name === 'container') {
        containerQueries++;
      }
    });
    if (validate) {
      root.walk((parent) => {
        if (!('nodes' in parent) || !parent.nodes) return;
        for (let i = 1; i < parent.nodes.length; i++) {
          const previous = parent.nodes[i - 1];
          const current = parent.nodes[i];
          if (
            previous &&
            current &&
            isAtRule(previous) &&
            isAtRule(current) &&
            previous.name === 'media' &&
            current.name === 'media' &&
            previous.params === current.params
          ) {
            failures.push(
              `${file}:${sourceLine(current)}: merge adjacent identical media queries (${current.params}).`,
            );
          }
        }
      });
    }
    root.walkRules(() => {
      rules++;
    });
    root.walkDecls((declaration) => {
      const { prop, value } = declaration;
      declarations++;
      if (isInventoryProperty(prop)) values[prop].add(value);
      for (const match of value.matchAll(/#[\da-f]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)/gi)) {
        colors.add(match[0].toLowerCase().replace(/\s+/g, ' '));
      }
      if (!validate) return;
      let parent: Node | undefined = declaration.parent;
      let print = false;
      while (parent) {
        if (isAtRule(parent) && parent.name === 'media' && /\bprint\b/.test(parent.params))
          print = true;
        parent = parent.parent;
      }
      // Explicit exceptions: document printing and container-scaled pricing numerals.
      if (
        prop === 'font-size' &&
        !sizeValues.has(value) &&
        !(print && printSizes.has(value)) &&
        !(
          file.endsWith('PricingSection.css') &&
          declaration.parent?.type === 'rule' &&
          declaration.parent.selector === '.plan-price' &&
          value === 'clamp(56px, 31cqi, 70px)'
        )
      ) {
        failures.push(
          `${file}:${sourceLine(declaration)}: font-size must use a shared role or scale token (${value}).`,
        );
      }
      if (prop === 'font' && /(?:^|\s)\d+px(?=\/|\s)/.test(value)) {
        failures.push(
          `${file}:${sourceLine(declaration)}: font shorthand must reuse the size scale.`,
        );
      }
      if (
        prop === 'border-radius' &&
        !/^(var\(|0$|inherit$)/.test(value) &&
        !value.includes('cqw')
      ) {
        failures.push(`${file}:${sourceLine(declaration)}: use a shared radius (${value}).`);
      }
      if (
        prop.startsWith('--font-size-') &&
        (!sizeSteps.has(Number(prop.slice('--font-size-'.length))) ||
          value !== `${prop.slice('--font-size-'.length)}px`)
      ) {
        failures.push(
          `${file}: font sizes must use the twelve approved steps (${prop}: ${value}).`,
        );
      }
      if (
        (prop === 'line-height' || /^--type-.*-leading$/.test(prop)) &&
        !leadingSteps.has(value)
      ) {
        failures.push(`${file}: use the six shared line heights (${value}).`);
      }
      if (
        prop === 'font' ||
        /^--type-(display|page|section|card|lead|body|small|control|code|metric)$/.test(prop)
      ) {
        const literal = value.match(/\/([\d.]+(?:px|em)?)(?=\s)/)?.[1];
        if (literal && !leadingSteps.has(literal))
          failures.push(`${file}: font recipe uses an unapproved line height (${literal}).`);
      }
      if (
        prop === 'box-shadow' &&
        ![...shadowRoles].some((role) => value === `var(--shadow-${role})`)
      ) {
        failures.push(`${file}: box-shadow must reuse one of the five shared roles (${value}).`);
      }
      if (prop.startsWith('--shadow-') && !shadowRoles.has(prop.slice('--shadow-'.length))) {
        failures.push(`${file}: do not add a one-off shadow role (${prop}).`);
      }
    });
  }
  return {
    files: sources.length,
    mediaQueries,
    uniqueMediaConditions: mediaConditions.size,
    containerQueries,
    rules,
    declarations,
    bytes,
    distinctValues: Object.fromEntries(
      properties.map((property) => [property, values[property].size]),
    ) as Record<InventoryProperty, number>,
    colorLiterals: colors.size,
  };
}

const files = await cssFiles('src');
const current = inventory(
  await Promise.all(
    files.map(async (file): Promise<CssSource> => [file, await readFile(file, 'utf8')]),
  ),
  true,
);
const args = process.argv.slice(2);
const refIndex = args.indexOf('--ref');
let baseline: StyleInventory | undefined;
if (refIndex >= 0) {
  const ref = args[refIndex + 1];
  if (!ref || ref.startsWith('-')) throw new Error('Provide a Git ref after --ref.');
  const oldFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, 'src'], {
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter((file) => file.endsWith('.css') && !file.startsWith('src/visuals/'));
  baseline = inventory(
    oldFiles.map((file): CssSource => [
      file,
      execFileSync('git', ['show', `${ref}:${file}`], { encoding: 'utf8' }),
    ]),
    false,
  );
}
const report = {
  scope:
    'Application CSS excluding protected src/visuals engines. Counts include container-scaled previews, print and theme adapters; they are not counts of public design roles.',
  ...(baseline ? { baseline } : {}),
  current,
};
console.log(JSON.stringify(report, null, 2));
const reportIndex = args.indexOf('--report');
if (reportIndex >= 0) {
  const path = args[reportIndex + 1];
  if (!path || path.startsWith('-')) throw new Error('Provide a path after --report.');
  await writeFile(path, JSON.stringify(report, null, 2) + '\n');
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('Shared size, six-leading, five-shadow and radius contracts passed.');
