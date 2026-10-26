import type manifest from './asset-manifest';
import { assetDirectories, artwork } from './asset-manifest';

export type AssetGroup = keyof typeof manifest.groups;
export type AssetFile<G extends AssetGroup> = (typeof manifest.groups)[G]['files'][number];
export type ThemedAsset = keyof typeof manifest.artwork;
export type EditorialAsset = Extract<ThemedAsset, `editorial/${string}`>;

/** All local artwork URLs use the same base-aware resolver. */
function publicAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function assetUrl<G extends AssetGroup>(group: G, filename: AssetFile<G>): string {
  return publicAssetUrl(`${assetDirectories[group]}/${filename}`);
}

/** Separate light/dark files, with responsive variants declared by the asset owner. */
export function artworkSources(asset: ThemedAsset, theme: 'light' | 'dark') {
  const stem = asset.replace(/\.webp$/, '') + (theme === 'dark' ? '-dark' : '');
  const src = publicAssetUrl(`assets/${stem}.webp`);
  return {
    src,
    ...(artwork[asset].responsive
      ? { srcSet: `${publicAssetUrl(`assets/${stem}-600.webp`)} 600w, ${src} 1200w` }
      : {}),
  };
}
