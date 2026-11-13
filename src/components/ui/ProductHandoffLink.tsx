import type { AnchorHTMLAttributes } from 'react';
import { useProductLanguage } from '../../hooks/useProductLanguage';

export function ProductLanguageDescription({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  return (
    <span className="product-language-description" id={id} hidden>
      {description}
    </span>
  );
}

/** One native link and one keyboard stop, with accessible language context. */
export function ProductHandoffLink({
  children,
  href,
  'aria-describedby': describedBy,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const language = useProductLanguage(href, describedBy);
  return (
    <a
      {...rest}
      href={href}
      aria-describedby={language.describedBy}
      data-product-language={language.isProductHref ? 'en' : undefined}
    >
      {children}
      {language.isProductHref && (
        <ProductLanguageDescription
          id={language.descriptionId}
          description={language.description}
        />
      )}
    </a>
  );
}
