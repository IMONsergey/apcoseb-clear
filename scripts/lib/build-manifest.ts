import { readFile } from 'node:fs/promises';
import type { RouteGroup } from '../../src/content/routes';

interface ManifestChunk {
  file: string;
  css?: string[];
  imports?: string[];
}
export type BuildManifest = Record<string, ManifestChunk>;

export const routeEntries = {
  home: 'src/pages/HomePage.tsx',
  platform: 'src/pages/PlatformPages.tsx',
  research: 'src/pages/ResearchPages.tsx',
  commercial: 'src/pages/CommercialPages.tsx',
  documentation: 'src/pages/ApiDocumentationPage.tsx',
  corporate: 'src/pages/CorporatePages.tsx',
  investors: 'src/pages/corporate/InvestorsPage.tsx',
  legal: 'src/pages/LegalPages.tsx',
} as const satisfies Record<RouteGroup, string>;

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
export async function readBuildManifest(directory = 'dist'): Promise<BuildManifest> {
  const value: unknown = JSON.parse(await readFile(`${directory}/.vite/manifest.json`, 'utf8'));
  if (!isBuildManifest(value)) throw new Error('Build manifest has an unexpected shape.');
  return value;
}

/** Only static dependencies belong to the initial page; optional scenes stay deferred. */
export function staticAssets(manifest: BuildManifest, entries: readonly string[]): Set<string> {
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
  entries.forEach(visit);
  return files;
}
