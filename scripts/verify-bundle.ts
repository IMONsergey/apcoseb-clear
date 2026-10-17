import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

interface ManifestChunk {
  file: string;
  css?: string[];
  imports?: string[];
}

type BuildManifest = Record<string, ManifestChunk>;
type AssetKind = 'js' | 'css';
type BundleLimit = readonly [entry: string, jsLimit: number, cssLimit: number, compressed: boolean];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isBuildManifest(value: unknown): value is BuildManifest {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (chunk) =>
        isRecord(chunk) &&
        typeof chunk.file === 'string' &&
        (chunk.css === undefined || isStringArray(chunk.css)) &&
        (chunk.imports === undefined || isStringArray(chunk.imports)),
    )
  );
}

// Follow static imports, including shared CSS. Optional scenes are deliberately excluded:
// their mount/scroll behavior belongs to the browser contract. Typograf stays in the entry.
const manifestValue: unknown = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));
if (!isBuildManifest(manifestValue)) throw new Error('Build manifest has an unexpected shape.');
const manifest = manifestValue;
const limits: readonly BundleLimit[] = [
  ['index.html', 335, 32, false],
  ['src/pages/HomePage.tsx', 132, 29, true],
  ['src/pages/LegalPages.tsx', 120, 10, true],
  ['src/pages/CorporatePages.tsx', 115, 21, true],
  ['src/pages/PlatformPages.tsx', 122, 26, true],
  ['src/pages/ResearchPages.tsx', 120, 24, true],
  ['src/pages/CommercialPages.tsx', 122, 25, true],
];
const problems: string[] = [];
for (const [entry, jsLimit, cssLimit, compressed] of limits) {
  const visited = new Set<string>();
  const files = new Set<string>();
  function visit(key: string): void {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing build manifest entry: ${key}`);
    files.add(chunk.file);
    for (const file of chunk.css ?? []) files.add(file);
    for (const imported of chunk.imports ?? []) visit(imported);
  }
  visit(entry);
  const sizes: Record<AssetKind, number> = { js: 0, css: 0 };
  for (const file of files) {
    const kind = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : undefined;
    if (!kind) continue;
    const content = await readFile(`dist/${file}`);
    sizes[kind] += compressed ? gzipSync(content).length : content.length;
  }
  const budgets: readonly (readonly [AssetKind, number])[] = [
    ['js', jsLimit],
    ['css', cssLimit],
  ];
  for (const [kind, limit] of budgets) {
    const kib = sizes[kind] / 1024;
    console.log(
      `${entry} ${kind.toUpperCase()} (${compressed ? 'gzip static graph' : 'raw'}): ${kib.toFixed(1)} / ${limit} KiB`,
    );
    if (kib > limit) problems.push(`${entry} ${kind} exceeds ${limit} KiB`);
  }
  if (entry.includes('LegalPages')) {
    for (const file of files) {
      if (/\/(?:HomePage|PageFrame|ThemedArtwork|gsap|evidencePlayback|theme-demos)-/.test(file))
        problems.push(`Legal unexpectedly depends on ${file}`);
    }
  }
}
if (problems.length) {
  problems.forEach((problem) => console.error(problem));
  process.exitCode = 1;
}
