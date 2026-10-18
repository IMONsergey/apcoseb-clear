import { LocaleText } from '../i18n/LocaleText';
import { useLocale } from '../i18n/context';
import { useEffect, useRef, useState } from 'react';
import { navigation } from '../content/navigation';
import { productUrl } from '../config/site';
import { siteHref } from '../app/paths';
import { signInUrl } from '../config/site';
import { DoubleButton } from './ui/DoubleButton';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import { LanguageBadge } from './ui/LanguageBadge';
import { ThemeMenu, MobileThemeControl } from './ui/ThemeControl';
import { Logo } from './ui/Logo';
import { useScrollHeader } from '../hooks/useScrollHeader';
export function Header({ forceVisible = false }: { forceVisible?: boolean }) {
  const { t } = useLocale();
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const brand = useRef<HTMLAnchorElement>(null);
  const focusFrame = useRef(0);
  const scheduleFocus = (resolveTarget: () => HTMLElement | null | undefined) => {
    cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = 0;
      const target = resolveTarget();
      if (target?.isConnected && !target.closest('[inert]')) target.focus();
    });
  };
  useEffect(() => () => cancelAnimationFrame(focusFrame.current), []);
  const state = useScrollHeader(ref, !!active || mobileOpen || forceVisible);
  const compact = forceVisible ? false : state.compact;
  const hidden = forceVisible ? false : state.hidden;
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1200px)');
    const onChange = () => {
      setActive(null);
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);
  useEffect(() => {
    if (!active) return;
    const onPointer = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !ref.current?.contains(event.target)) setActive(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const trigger = ref.current?.querySelector<HTMLElement>('[aria-expanded="true"]');
        setActive(null);
        trigger?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);
  return (
    <>
      <div className="header-spacer" aria-hidden="true" />
      <header
        className="site-header"
        ref={ref}
        data-compact={compact}
        data-hidden={hidden}
        aria-hidden={hidden || undefined}
        inert={hidden}
      >
        <div className="container header-row">
          <a ref={brand} className="brand" href={siteHref('/')} aria-label={t('Apcosys home')}>
            <Logo />
          </a>
          <nav className="desktop-nav" aria-label={t('Main navigation')}>
            {navigation.map((group, i) => (
              <div
                className="nav-group"
                key={group.label}
                onKeyDown={(event) => {
                  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                  const links = Array.from(
                    event.currentTarget.querySelectorAll<HTMLAnchorElement>('.nav-panel a'),
                  );
                  if (!links.length) return;
                  const focused = links.findIndex((link) => link === document.activeElement);
                  event.preventDefault();
                  setActive(group.label);
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? links.length - 1
                        : focused < 0
                          ? event.key === 'ArrowUp'
                            ? links.length - 1
                            : 0
                          : (focused + (event.key === 'ArrowDown' ? 1 : -1) + links.length) %
                            links.length;
                  scheduleFocus(() => links[next]);
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
                }}
              >
                <button
                  type="button"
                  className="nav-trigger"
                  aria-expanded={active === group.label}
                  aria-controls={`nav-panel-${i}`}
                  onClick={() => setActive(active === group.label ? null : group.label)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setActive(group.label);
                      scheduleFocus(() =>
                        document.querySelector<HTMLAnchorElement>(`#nav-panel-${i} a`),
                      );
                    }
                  }}
                >
                  <LocaleText>{t(group.label)}</LocaleText>
                  <Icon name="chevron" />
                </button>
                <div
                  id={`nav-panel-${i}`}
                  className="nav-panel"
                  data-open={active === group.label}
                  aria-hidden={active !== group.label}
                  inert={active !== group.label}
                >
                  {group.items.map((item, index) => (
                    <a
                      className={index === 0 ? 'nav-panel__default' : undefined}
                      key={item.label}
                      href={item.href.startsWith('/') ? siteHref(item.href) : item.href}
                      onClick={() => setActive(null)}
                    >
                      <LocaleText>{t(item.label)}</LocaleText>
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <a className="nav-link nav-trigger" href={siteHref('/teams')}>
              <LocaleText>{t('For Teams')}</LocaleText>
            </a>
            <a className="nav-link nav-trigger" href={siteHref('/pricing')}>
              <LocaleText>{t('Pricing')}</LocaleText>
            </a>
          </nav>
          <div className="header-actions">
            <ThemeMenu
              open={active === 'appearance'}
              onOpenChange={(open) => setActive(open ? 'appearance' : null)}
            />
            <LanguageBadge
              open={active === 'language'}
              onOpenChange={(open) => setActive(open ? 'language' : null)}
            />
            <a href={signInUrl} className="plain-button header-signin">
              <LocaleText>{t('Sign In')}</LocaleText>
            </a>
            <DoubleButton href={`${productUrl}/search`} compact className="header-signup">
              <LocaleText>{t('Try Search')}</LocaleText>
            </DoubleButton>
            <button
              className="icon-button menu-toggle"
              type="button"
              aria-label={t('Open navigation')}
              aria-expanded={mobileOpen}
              onClick={(event) => {
                event.currentTarget.focus();
                setMobileOpen(true);
              }}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>
      <Modal
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title={t('Navigation')}
        className="mobile-navigation"
        fallbackFocus={brand}
      >
        <nav aria-label={t('Mobile navigation')}>
          {navigation.map((group) => (
            <div className="mobile-nav-group" key={group.label}>
              <p className="eyebrow">
                <LocaleText>{t(group.label)}</LocaleText>
              </p>
              {group.items.map((item) => (
                <a
                  key={item.label}
                  href={item.href.startsWith('/') ? siteHref(item.href) : item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <LocaleText>{t(item.label)}</LocaleText>
                  <Icon name="arrow" />
                </a>
              ))}
            </div>
          ))}
          <a
            className="mobile-pricing"
            href={siteHref('/teams')}
            onClick={() => setMobileOpen(false)}
          >
            <LocaleText>{t('For Teams')}</LocaleText> <Icon name="arrow" />
          </a>
          <a
            className="mobile-pricing"
            href={siteHref('/pricing')}
            onClick={() => setMobileOpen(false)}
          >
            <LocaleText>{t('Pricing')}</LocaleText>
            <Icon name="arrow" />
          </a>
          <DoubleButton href={`${productUrl}/search`}>
            <LocaleText>{t('Try Search')}</LocaleText>
          </DoubleButton>
          <a className="plain-button" href={signInUrl}>
            <LocaleText>{t('Sign In')}</LocaleText>
          </a>
          <MobileThemeControl />
        </nav>
      </Modal>
    </>
  );
}
