import type { ImgHTMLAttributes } from 'react';
import { artworkSources, type ThemedAsset } from '../../content/assets';
import { useTheme } from '../../theme/ThemeProvider';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  asset: ThemedAsset;
};

/** Art-directed light/dark files; never recolor a rendered illustration with CSS. */
export function ThemedArtwork({ asset, ...props }: Props) {
  const { theme } = useTheme();
  return (
    <img {...props} key={theme} data-artwork-theme={theme} {...artworkSources(asset, theme)} />
  );
}
