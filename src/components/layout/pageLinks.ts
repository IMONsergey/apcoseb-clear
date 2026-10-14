import type { SiteLink } from '../../content/routes';
import { siteHref } from '../../app/paths';
import { productUrl } from '../../config/site';
import type { PageLink } from './PageFrame';

export const primarySearch: PageLink = { label: 'Try Search', href: productUrl + '/search' };
export const primaryContact: PageLink = { label: 'Talk to Us', href: siteHref('/contact') };
export const linkTo = (label: string, path: SiteLink, secondary = false): PageLink => ({
  label,
  href: siteHref(path),
  secondary,
});
