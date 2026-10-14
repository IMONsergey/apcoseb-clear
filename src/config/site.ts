import { readPublicSettings } from './public-settings';

/** Public settings are embedded into the client bundle at build time. */
export const { productUrl, supportEmail, signInUrl, apiDocumentationUrl } = readPublicSettings(
  import.meta.env,
);
