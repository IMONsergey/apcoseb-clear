import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

// npm forwards flags to this orchestrator, not to the last command in a shell chain.
const args = process.argv.slice(2);
let base: string | undefined;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (!arg) throw new Error('Build options must not be empty.');
  if (arg === '--base') {
    base = args[i + 1];
    i++;
  } else if (arg.startsWith('--base=')) base = arg.slice(7);
  else throw new Error(`Unknown build option: ${arg}. Supported: --base=/path/`);
  if (!base || !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) {
    throw new Error(
      'Build base must be / or an absolute directory path ending in /, such as /site/.',
    );
  }
}
const env = { ...process.env, ...loadEnv('production', process.cwd(), 'APCO_') };
function run(script: string, scriptArgs: readonly string[] = []): void {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const runTypeScript = (script: string, scriptArgs: readonly string[] = []): void => {
  run('--import', ['tsx', script, ...scriptArgs]);
};
runTypeScript('scripts/compile-legal.ts', ['--check']);
run(fileURLToPath(import.meta.resolve('typescript/bin/tsc')), ['-b']);
run(fileURLToPath(new URL('bin/vite.js', import.meta.resolve('vite/package.json'))), [
  'build',
  ...(base ? ['--base', base] : []),
]);
runTypeScript('scripts/prerender-route-meta.ts');
runTypeScript('scripts/verify-bundle.ts');
