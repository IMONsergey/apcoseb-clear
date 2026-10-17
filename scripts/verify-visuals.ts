import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

interface EngineIntegrityEntry {
  path: string;
  sha256: string;
}

function isEngineIntegrityManifest(value: unknown): value is EngineIntegrityEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        'path' in entry &&
        typeof entry.path === 'string' &&
        'sha256' in entry &&
        typeof entry.sha256 === 'string',
    )
  );
}

const manifest: unknown = JSON.parse(await readFile('src/visuals/engine-integrity.json', 'utf8'));
if (!isEngineIntegrityManifest(manifest)) {
  throw new Error('Rendering module integrity manifest has an unexpected shape.');
}
const engines = manifest;
const failures: string[] = [];
for (const entry of engines) {
  const contents = await readFile(resolve(entry.path));
  const actual = createHash('sha256').update(contents).digest('hex');
  if (actual !== entry.sha256) failures.push(entry.path);
}
if (failures.length) {
  console.error('Rendering module integrity mismatch:', failures.join(', '));
  process.exitCode = 1;
} else {
  console.log(`${engines.length} rendering/data modules match their integrity hashes.`);
}
