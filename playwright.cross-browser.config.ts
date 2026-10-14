import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Focused, current interaction contract in all three browser engines.
export default defineConfig({
  ...base,
  testMatch:
    '**/{design-system,inner-hero-layout,style-contract,routes,interactions,product-experience,dark-artwork,responsive-navigation,responsive-containers,theme-transitions,motion-and-focus,route-motion,handoff}.spec.ts',
});
