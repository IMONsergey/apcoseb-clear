import { loadEnv } from 'vite';
import { readPublicSettings } from '../../src/config/public-settings';

/** Match the production Vite build, including optional local .env overrides. */
export const deploymentSettings = readPublicSettings(
  loadEnv('production', process.cwd(), 'VITE_APCO_'),
);
