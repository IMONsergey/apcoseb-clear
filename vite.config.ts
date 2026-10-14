import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readPublicSettings } from './src/config/public-settings.ts';
export default defineConfig(({ mode }) => {
  const publicSettings = readPublicSettings(loadEnv(mode, process.cwd(), 'VITE_APCO_'));
  return {
    plugins: [
      react(),
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
    },
    server: { host: '127.0.0.1', port: 5187, strictPort: true },
    preview: { host: '127.0.0.1', port: 4187, strictPort: true },
  };
});
