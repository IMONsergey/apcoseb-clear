import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/** Full current release contract in Chromium. */
export default defineConfig({
  ...base,
  projects: base.projects?.filter((project) => project.name === 'chromium') ?? [],
});
