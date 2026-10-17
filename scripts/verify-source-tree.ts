import { readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const excludedRoots = new Set([
  '.git',
  '.work',
  '.vercel',
  'node_modules',
  'dist',
  'test-results',
  'playwright-report',
]);
const invalidWindowsNames = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const invalidCharacters = /[<>:"\\|?*]/;

export interface SourceTreeReport {
  files: number;
  failures: string[];
}

export function inspectSourceTree(root = process.cwd()): SourceTreeReport {
  const failures: string[] = [];
  const names = new Map<string, string>();
  let files = 0;
  function scan(directory: string, isRoot = false): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (isRoot && excludedRoots.has(entry.name)) continue;
      const absolute = resolve(directory, entry.name);
      const name = relative(root, absolute).split(sep).join('/');
      const portableName = name.normalize('NFC').toLowerCase();
      const previous = names.get(portableName);
      if (previous) failures.push(`Case or Unicode path collision: ${previous} / ${name}`);
      else names.set(portableName, name);
      const base = entry.name.split('.')[0] ?? '';
      if (
        entry.name !== entry.name.normalize('NFC') ||
        invalidCharacters.test(entry.name) ||
        [...entry.name].some((character) => character.charCodeAt(0) < 32) ||
        /[ .]$/.test(entry.name) ||
        invalidWindowsNames.test(base)
      )
        failures.push(`Non-portable filename: ${name}`);
      if (entry.name === '.DS_Store' || /\.(?:bak|orig|rej)$/.test(entry.name))
        failures.push(`Transient file in source tree: ${name}`);
      if (entry.isSymbolicLink()) failures.push(`Symbolic link requires review: ${name}`);
      else if (entry.isDirectory()) scan(absolute);
      else if (entry.isFile()) files++;
    }
  }
  scan(resolve(root), true);
  // Compare against the Git index as well: a case-insensitive checkout can hide one of
  // two distinct tracked paths before the filesystem traversal sees it.
  if (existsSync(resolve(root, '.git'))) {
    const tracked = spawnSync(
      'git',
      ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { encoding: 'utf8' },
    );
    if (tracked.status !== 0) failures.push('Cannot inspect the Git source index.');
    else {
      const indexedNames = new Map<string, string>();
      for (const name of tracked.stdout.split('\0').filter(Boolean)) {
        const key = name.normalize('NFC').toLowerCase();
        const previous = indexedNames.get(key);
        if (previous && previous !== name)
          failures.push(`Git index path collision: ${previous} / ${name}`);
        else indexedNames.set(key, name);
        if (!existsSync(resolve(root, name)))
          failures.push(`Tracked source file missing from checkout: ${name}`);
      }
    }
  }
  for (const historical of ['docs/archive', 'tests/review', 'playwright.review.config.ts'])
    if (names.has(historical.toLowerCase()))
      failures.push(`Archived review material must stay outside deliverable source: ${historical}`);
  return { files, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = inspectSourceTree();
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
  else console.log('Source filenames and directories are portable and release-ready.');
}
