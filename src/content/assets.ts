import manifest from './asset-manifest';

export type AssetGroup = keyof typeof manifest.groups;
export type AssetFile<G extends AssetGroup> = (typeof manifest.groups)[G]['files'][number];
export type ThemedAsset = keyof typeof manifest.artwork;
export type EditorialAsset = Extract<ThemedAsset, `editorial/${string}`>;

/** All local artwork URLs use the same base-aware resolver. */
function publicAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function assetUrl<G extends AssetGroup>(group: G, filename: AssetFile<G>): string {
  return publicAssetUrl(`${manifest.groups[group].directory}/${filename}`);
}

/** Separate light/dark files, with responsive variants declared by the asset owner. */
export function artworkSources(asset: ThemedAsset, theme: 'light' | 'dark') {
  const stem = asset.replace(/\.webp$/, '') + (theme === 'dark' ? '-dark' : '');
  const src = publicAssetUrl(`assets/${stem}.webp`);
  return {
    src,
    ...(manifest.artwork[asset].responsive
      ? { srcSet: `${publicAssetUrl(`assets/${stem}-600.webp`)} 600w, ${src} 1200w` }
      : {}),
  };
}

/** Derived theme/resolution filenames are checked against the same manifest. */
export function assetVariantUrl<G extends 'closing' | 'walkthrough'>(
  group: G,
  filename: AssetFile<G>,
  theme: 'light' | 'dark',
  width?: 360 | 600,
): string {
  const stem = filename.replace(/\.webp$/, '');
  const variant = `${stem}${theme === 'dark' ? '-dark' : ''}${width ? `-${width}` : ''}.webp`;
  if (!(manifest.groups[group].files as readonly string[]).includes(variant))
    throw new Error(`Missing ${group} asset variant: ${variant}`);
  return assetUrl(group, variant as AssetFile<G>);
}
