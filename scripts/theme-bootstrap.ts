import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { Plugin } from 'vite';

const sourcePath = fileURLToPath(new URL('../src/theme/bootstrap.ts', import.meta.url));
const marker = '<!-- APCO_THEME_BOOTSTRAP -->';

export function renderThemeBootstrap(): string {
  return ts
    .transpileModule(readFileSync(sourcePath, 'utf8'), {
      fileName: sourcePath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.None,
        removeComments: true,
      },
    })
    .outputText.trim();
}

export function themeBootstrap(): Plugin {
  return {
    name: 'apcosys-theme-bootstrap',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes(marker)) throw new Error('Missing theme bootstrap marker.');
        return html.replace(marker, `<script>${renderThemeBootstrap()}</script>`);
      },
    },
    handleHotUpdate({ file, server }) {
      if (file !== sourcePath) return;
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}
