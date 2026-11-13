import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { useProductLanguage } from '../../hooks/useProductLanguage';
import { ProductLanguageDescription } from './ProductHandoffLink';
type Shared = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'inverse' | 'dark';
  icon?: IconName;
  className?: string;
  compact?: boolean;
};
type Props = Shared &
  (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: never } & ButtonHTMLAttributes<HTMLButtonElement>)
  );
/** Two visible shapes; one semantic action and one keyboard stop. */
export function DoubleButton({
  children,
  variant = 'primary',
  icon = 'arrow',
  className = '',
  compact = false,
  ...rest
}: Props) {
  const language = useProductLanguage(
    'href' in rest ? rest.href : undefined,
    rest['aria-describedby'],
  );
  const classes =
    `double-button double-button--${variant}${compact ? ' double-button--compact' : ''} ${className}`.trim();
  const content = (
    <>
      <span className="double-button__label">{children}</span>
      <span className="double-button__icon">
        <Icon name={icon} />
      </span>
      {language.isProductHref && (
        <ProductLanguageDescription
          id={language.descriptionId}
          description={language.description}
        />
      )}
    </>
  );
  if ('href' in rest && rest.href)
    return (
      <a
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        className={classes}
        aria-describedby={language.describedBy}
        data-product-language={language.isProductHref ? 'en' : undefined}
      >
        {content}
      </a>
    );
  return (
    <button
      type="button"
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={classes}
    >
      {content}
    </button>
  );
}
