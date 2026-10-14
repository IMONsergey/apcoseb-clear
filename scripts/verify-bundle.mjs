import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

// Follow static imports, including shared CSS. Optional scenes are deliberately excluded:
// their mount/scroll behavior belongs to the browser contract. Typograf stays in the entry.
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));
const limits = [
  ['index.html', 335, 32, false],
  ['src/pages/HomePage.tsx', 132, 29, true],
  ['src/pages/LegalPages.tsx', 120, 10, true],
  ['src/pages/CorporatePages.tsx', 115, 21, true],
  ['src/pages/PlatformPages.tsx', 122, 26, true],
  ['src/pages/ResearchPages.tsx', 120, 24, true],
  ['src/pages/CommercialPages.tsx', 122, 25, true],
];
const problems = [];
for (const [entry, jsLimit, cssLimit, compressed] of limits) {
  const visited = new Set();
  const files = new Set();
  function visit(key) {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing build manifest entry: ${key}`);
    files.add(chunk.file);
    for (const file of chunk.css ?? []) files.add(file);
    for (const imported of chunk.imports ?? []) visit(imported);
  }
  visit(entry);
  const sizes = { js: 0, css: 0 };
  for (const file of files) {
    const kind = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : undefined;
    if (!kind) continue;
    const content = await readFile(`dist/${file}`);
    sizes[kind] += compressed ? gzipSync(content).length : content.length;
  }
  for (const [kind, limit] of [
    ['js', jsLimit],
    ['css', cssLimit],
  ]) {
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
