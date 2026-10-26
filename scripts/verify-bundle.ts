import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { readBuildManifest, staticAssets } from './lib/build-manifest';

type AssetKind = 'js' | 'css';
type BundleLimit = readonly [entry: string, jsLimit: number, cssLimit: number, compressed: boolean];

const manifest = await readBuildManifest();
const limits: readonly BundleLimit[] = [
  ['index.html', 335, 32, false],
  ['src/pages/HomePage.tsx', 132, 29, true],
  ['src/pages/LegalPages.tsx', 120, 10, true],
  ['src/pages/CorporatePages.tsx', 116, 21, true],
  ['src/pages/corporate/InvestorsPage.tsx', 110, 20, true],
  ['src/pages/PlatformPages.tsx', 122, 26, true],
  ['src/pages/ResearchPages.tsx', 120, 24, true],
  ['src/pages/CommercialPages.tsx', 122, 25, true],
  ['src/pages/ApiDocumentationPage.tsx', 120, 14, true],
];
const problems: string[] = [];
for (const [entry, jsLimit, cssLimit, compressed] of limits) {
  const files = staticAssets(manifest, ['index.html', entry]);
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
      if (
        /\/(?:HomePage|PageFrame|ThemedArtwork|gsap|evidencePlayback|applicationPlayback)-/.test(
          file,
        )
      )
        problems.push(`Legal unexpectedly depends on ${file}`);
    }
  }
}
if (problems.length) {
  problems.forEach((problem) => console.error(problem));
  process.exitCode = 1;
}
