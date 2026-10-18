import ts from 'typescript';
import { readdir, stat, access, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

interface AssetGroup {
  directory: string;
  files: string[];
}

interface ArtworkEntry {
  responsive: boolean;
}

interface AssetManifest {
  groups: Record<string, AssetGroup>;
  artwork: Record<string, ArtworkEntry>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAssetGroup(value: unknown): value is AssetGroup {
  return (
    isRecord(value) &&
    typeof value.directory === 'string' &&
    Array.isArray(value.files) &&
    value.files.every((file) => typeof file === 'string')
  );
}

function isAssetManifest(value: unknown): value is AssetManifest {
  if (!isRecord(value) || !isRecord(value.groups) || !isRecord(value.artwork)) return false;
  return (
    Object.values(value.groups).every(isAssetGroup) &&
    Object.values(value.artwork).every(
      (entry) => isRecord(entry) && typeof entry.responsive === 'boolean',
    )
  );
}

const root = 'public';
const source = await readFile('src/content/asset-manifest.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const compiledModule: { exports: unknown } = { exports: {} };
new Function('exports', 'module', compiled)(compiledModule.exports, compiledModule);
const exported = isRecord(compiledModule.exports) ? compiledModule.exports.default : undefined;
if (!isAssetManifest(exported)) throw new Error('Asset manifest has an unexpected shape.');
const manifest = exported;
const expected = new Set<string>([
  ...Object.values(manifest.groups).flatMap(({ directory, files }) =>
    files.map((name) => `${directory}/${name}`),
  ),
  ...Object.entries(manifest.artwork).flatMap(([file, { responsive }]) => {
    const stem = file.replace(/\.webp$/, '');
    return ['', '-dark'].flatMap((theme) =>
      (responsive ? ['', '-600'] : ['']).map((size) => `assets/${stem}${theme}${size}.webp`),
    );
  }),
]);

async function allFiles(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const pathname = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await allFiles(pathname)));
    else if (entry.isFile()) output.push(relative(root, pathname).split('\\').join('/'));
  }
  return output;
}

const actual = new Set(await allFiles(join(root, 'assets')));
const corrupt: string[] = [];
for (const filename of actual) {
  const data = await readFile(join(root, filename));
  if (filename.endsWith('.webp')) {
    if (
      data.length < 40 ||
      data.toString('ascii', 0, 4) !== 'RIFF' ||
      data.toString('ascii', 8, 12) !== 'WEBP'
    ) {
      corrupt.push(filename);
    }
  } else if (filename.endsWith('.svg')) {
    const svg = data.toString('utf8');
    if (!/<svg[\s>]/i.test(svg) || /<script[\s>]|<foreignObject[\s>]|\son\w+\s*=/i.test(svg)) {
      corrupt.push(filename);
    }
  }
}
const missing = [...expected].filter((path) => !actual.has(path));
const unexpected = [...actual].filter((path) => !expected.has(path));
const localFonts = [
  'fonts/instrument-sans-latin.woff2',
  'fonts/ibm-plex-mono-latin.woff2',
  'fonts/ibm-plex-mono-latin-1.woff2',
  'fonts/LICENSE-Instrument-Sans.txt',
  'fonts/LICENSE-IBM-Plex-Mono.txt',
  'fonts/onest-cyrillic.woff2',
  'fonts/onest-latin.woff2',
  'fonts/ibm-plex-mono-cyrillic-400.woff2',
  'fonts/ibm-plex-mono-cyrillic-500.woff2',
  'fonts/LICENSE-Onest.txt',
];
for (const filename of localFonts) {
  try {
    await access(join(root, filename));
    if ((await stat(join(root, filename))).size === 0) missing.push(filename);
  } catch {
    missing.push(filename);
  }
}

if (missing.length || unexpected.length || corrupt.length) {
  for (const filename of missing) console.error('Missing asset:', filename);
  for (const filename of unexpected) console.error('Unregistered asset:', filename);
  for (const filename of corrupt) console.error('Corrupt/unsafe asset:', filename);
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${expected.size} images/logos and ${localFonts.length} font/license files.`,
  );
}
