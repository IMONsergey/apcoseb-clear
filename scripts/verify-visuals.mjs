import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const manifest = JSON.parse(await readFile('src/visuals/engine-integrity.json', 'utf8'));
const engines = manifest;
const failures = [];
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
