/// <reference types="vite/client" />
import { assetUrl } from '../../src/content/assets';
import type { SiteLink } from '../../src/content/routes';

// Compile-only contract: typos and files belonging to another group must stay errors.
export function checkAssetAndRouteTypes() {
  assetUrl('brand', 'logo.svg');
  assetUrl('application', 'code.svg');
  // @ts-expect-error An existing filename in another group is still invalid.
  assetUrl('brand', 'code.svg');
  // @ts-expect-error A typo must not produce a runtime 404.
  assetUrl('brand', 'logoo.svg');
  // @ts-expect-error Internal routes come from the typed manifest.
  const missing: SiteLink = '/platform/not-a-page';
  return missing;
}
