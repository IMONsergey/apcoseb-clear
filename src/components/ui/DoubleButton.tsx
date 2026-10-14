import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
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
  const classes =
    `double-button double-button--${variant}${compact ? ' double-button--compact' : ''} ${className}`.trim();
  const content = (
    <>
      <span className="double-button__label">{children}</span>
      <span className="double-button__icon">
        <Icon name={icon} />
      </span>
    </>
  );
  if ('href' in rest && rest.href)
    return (
      <a {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} className={classes}>
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
