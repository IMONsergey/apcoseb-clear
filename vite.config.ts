import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { adaptPublicApiDocument } from './src/lib/public-api-document.ts';
import { compilePublicApiDocument } from './src/lib/public-api-compile.ts';
import react from '@vitejs/plugin-react';
import { readPublicSettings } from './src/config/public-settings.ts';
import { themeBootstrap } from './scripts/theme-bootstrap.ts';
export default defineConfig(({ mode }) => {
  const publicSettings = readPublicSettings(loadEnv(mode, process.cwd(), 'VITE_APCO_'));
  const publicApiSpec = readFileSync(
    new URL('./public/api/client.openapi.json', import.meta.url),
    'utf8',
  );
  // Invalid bundled data is a build error, never a broken production fallback.
  const publicApiDocument = compilePublicApiDocument(
    adaptPublicApiDocument(JSON.parse(publicApiSpec) as unknown),
  );
  return {
    define: {
      __APCO_PUBLIC_SETTINGS__: JSON.stringify(publicSettings),
      __APCO_PUBLIC_API_DOCUMENT__: JSON.stringify(publicApiDocument),
    },
    plugins: [
      react(),
      themeBootstrap(),
      {
        name: 'apcosys-noscript-link',
        transformIndexHtml: {
          order: 'pre',
          handler(html: string) {
            const marker = '__APCO_PUBLIC_SEARCH_URL__';
            if (!html.includes(marker)) {
              throw new Error('Missing no-JavaScript search link marker.');
            }
            return html.replace(marker, new URL('/search', publicSettings.productUrl).href);
          },
        },
      },
    ],
    base: '/apcoseb-clear/',
    build: {
      target: 'es2022',
      sourcemap: false,
      cssCodeSplit: true,
      manifest: true,
      // WebKit can retain failed modulepreload requests across reloads (#270357).
      // prepareRoute still warms actual imports before client navigation.
      modulePreload: false,
      rolldownOptions: {
        output: {
          codeSplitting: {
            // React and typography are required on every route. One runtime chunk
            // avoids separate compression overhead when adding lazy page entries.
            groups: [
              {
                name: 'site-runtime',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler|typograf)[\\/]/,
                includeDependenciesRecursively: false,
              },
            ],
          },
        },
      },
    },
    server: { host: '127.0.0.1', port: 5187, strictPort: true },
    preview: { host: '127.0.0.1', port: 4187, strictPort: true },
  };
});
