import { defineConfig } from '@playwright/test';
import release from './playwright.release.config';

/** Exercise deep links, 404 recovery and localized assets at a new hosting base. */
export default defineConfig({
  ...release,
  testMatch:
    '**/{handoff,routes,asset-delivery,font-loading,russian-typography,arcade-404,configuration}.spec.ts',
});
