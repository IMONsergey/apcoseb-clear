import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

// npm forwards flags to this orchestrator, not to the last command in a shell chain.
const args = process.argv.slice(2);
let base;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--base') base = args[++i];
  else if (arg.startsWith('--base=')) base = arg.slice(7);
  else throw new Error(`Unknown build option: ${arg}. Supported: --base=/path/`);
  if (!base || !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) {
    throw new Error(
      'Build base must be / or an absolute directory path ending in /, such as /site/.',
    );
  }
}
const env = { ...process.env, ...loadEnv('production', process.cwd(), 'APCO_PUBLIC_SITE_ORIGIN') };
function run(script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('scripts/compile-legal.mjs', ['--check']);
run(fileURLToPath(import.meta.resolve('typescript/bin/tsc')), ['-b']);
run(fileURLToPath(new URL('bin/vite.js', import.meta.resolve('vite/package.json'))), [
  'build',
  ...(base ? ['--base', base] : []),
]);
run('scripts/prerender-route-meta.mjs');
run('scripts/verify-bundle.mjs');
