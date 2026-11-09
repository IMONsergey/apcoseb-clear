import { useId } from 'react';
import { productUrl, signInUrl } from '../config/site';
import { useLocale } from '../i18n/context';

/** Describe the existing application destination without rewriting its URL or query. */
export function useProductLanguage(href?: string, describedBy?: string) {
  const descriptionId = useId();
  const { t } = useLocale();
  const isProductHref = Boolean(
    href && (href === signInUrl || href === productUrl || href.startsWith(productUrl + '/')),
  );
  return {
    isProductHref,
    descriptionId,
    description: t('Application interface: English.'),
    describedBy:
      [describedBy, isProductHref ? descriptionId : undefined].filter(Boolean).join(' ') ||
      undefined,
  };
}
