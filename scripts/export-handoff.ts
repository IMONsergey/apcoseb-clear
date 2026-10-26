import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const git = (...args: string[]): string => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('status', '--porcelain', '--untracked-files=all')) {
  throw new Error('Commit source changes before exporting a reproducible snapshot.');
}
execFileSync(process.execPath, ['--import', 'tsx', 'scripts/verify-source-tree.ts'], {
  stdio: 'inherit',
});

const sha = git('rev-parse', 'HEAD');
const output = resolve('.work', `apcosys-web-source-${sha.slice(0, 12)}.zip`);
mkdirSync(resolve('.work'), { recursive: true });

// The ZIP contains only committed source, never .git or a source-history marker.
execFileSync(
  'git',
  ['archive', '--format=zip', '--prefix=apcosys-web/', `--output=${output}`, `${sha}^{tree}`],
  { stdio: 'inherit' },
);
console.log(`Source snapshot: ${output}\nVerified from commit: ${sha}`);
