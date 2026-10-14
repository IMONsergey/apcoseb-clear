import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
export default tseslint.config(
  {
    // Only the six checksum-protected supplied originals are excluded. Adaptations are linted.
    ignores: [
      'dist',
      '.work',
      'playwright-report',
      'test-results',
      'src/visuals/flow/turquoise-flow.js',
      'src/visuals/waves/ice-sphere-waves.js',
      'src/visuals/globe/land-data.js',
      'src/visuals/globe/signal-globe.js',
      'src/visuals/dots/dot-cascade.js',
      'src/visuals/shapes/animated-shapes.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  { files: ['src/visuals/**/*.tsx'], rules: { 'react-hooks/exhaustive-deps': 'off' } },
  { files: ['src/visuals/**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['*.js', 'scripts/**/*.mjs'], languageOptions: { globals: globals.node } },
);
