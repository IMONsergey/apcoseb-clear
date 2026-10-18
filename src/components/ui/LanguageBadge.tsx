import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { Icon } from './Icon';
import { languageOptions, type LanguageCode } from '../../i18n/language-options';
import { useLocale } from '../../i18n/context';
import { getRoutePath, localeHref } from '../../app/paths';

function focusInPlace(node?: HTMLElement) {
  if (!node) return;
  const position = { left: scrollX, top: scrollY };
  node.focus({ preventScroll: true });
  window.scrollTo({ ...position, behavior: 'instant' });
}

function LanguageFlag({ locale }: { locale: LanguageCode }) {
  const clip = useId();
  return (
    <svg
      className="language-flag"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath={'url(#' + clip + ')'}>
        {locale === 'en' ? (
          <>
            <path fill="#012169" d="M0 0h24v24H0z" />
            <path stroke="#fff" strokeWidth="5" d="m0 0 24 24M24 0 0 24" />
            <path stroke="#c8102e" strokeWidth="2" d="m0 0 24 24M24 0 0 24" />
            <path stroke="#fff" strokeWidth="8" d="M12 0v24M0 12h24" />
            <path stroke="#c8102e" strokeWidth="4.5" d="M12 0v24M0 12h24" />
          </>
        ) : locale === 'ru' ? (
          <>
            <path fill="#fff" d="M0 0h24v8H0z" />
            <path fill="#0039a6" d="M0 8h24v8H0z" />
            <path fill="#d52b1e" d="M0 16h24v8H0z" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="11" fill="#eef6f7" stroke="#087f92" strokeWidth="2" />
            <path
              fill="none"
              stroke="#087f92"
              strokeWidth="1.5"
              d="M1.8 12h20.4M12 1.5c3 3.1 4.3 6.6 4.3 10.5S15 19.4 12 22.5C9 19.4 7.7 15.9 7.7 12S9 4.6 12 1.5Z"
            />
          </>
        )}
      </g>
    </svg>
  );
}

export function LanguageBadge({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { locale, t } = useLocale();
  const id = useId();
  const panelId = id + '-languages';
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusFrame = useRef(0);
  const cancelFocus = () => {
    cancelAnimationFrame(focusFrame.current);
    focusFrame.current = 0;
  };
  useEffect(() => cancelFocus, []);

  const close = () => {
    cancelFocus();
    onOpenChange(false);
    focusInPlace(trigger.current ?? undefined);
  };
  const focusOption = (position: 'current' | 'first' | 'last' = 'current') => {
    cancelFocus();
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = 0;
      const options = Array.from(
        panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
      );
      const option =
        position === 'first'
          ? options[0]
          : position === 'last'
            ? options.at(-1)
            : (options.find((item) => item.getAttribute('aria-checked') === 'true') ?? options[0]);
      if (option && !option.closest('[inert]')) focusInPlace(option);
    });
  };
  const openMenu = (fromKeyboard = false) => {
    onOpenChange(true);
    // Pointer activation should not paint a keyboard focus ring on the selected locale.
    // Keyboard and assistive-technology activation still enter the menu.
    if (fromKeyboard) focusOption();
  };
  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const options = Array.from(
        panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
      );
      if (event.key === 'Home' || event.key === 'End') {
        focusOption(event.key === 'Home' ? 'first' : 'last');
        return;
      }
      const focused = options.findIndex((option) => option === document.activeElement);
      const next =
        focused < 0
          ? options.findIndex((option) => option.getAttribute('aria-checked') === 'true')
          : (focused + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      focusInPlace(options[Math.max(next, 0)]);
    }
  };
  const routePath = getRoutePath();
  const suffix = location.search + location.hash;
  const optionHref = (language: LanguageCode) =>
    routePath === '/404' ? null : localeHref(routePath + suffix, language);
  const shortLabel: Record<LanguageCode, string> = { en: 'EN', ru: 'RU', 'zh-Hant': '繁中' };
  const selected = languageOptions.find((language) => language.value === locale)!;

  return (
    <div
      className="language-control"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          cancelFocus();
          onOpenChange(false);
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="language"
        data-language-selector=""
        aria-label={`${selected.label} — ${t('Language')}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          const fromKeyboard = event.detail === 0;
          // Mouse/touch activation focuses after the pointer event instead of
          // forcing a focus-visible ring during mousedown.
          if (!fromKeyboard) focusInPlace(event.currentTarget);
          if (open) close();
          else openMenu(fromKeyboard);
        }}
        onKeyDown={(event) => {
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            openMenu(true);
          } else if (event.key === 'Tab' && open) {
            cancelFocus();
            onOpenChange(false);
          }
        }}
      >
        <LanguageFlag locale={locale} />
        <span className="locale-text" lang={locale}>
          {shortLabel[locale]}
        </span>
        <Icon name="chevron" />
      </button>

      <div
        ref={panel}
        id={panelId}
        role="menu"
        aria-label={t('Language')}
        className="nav-panel language-panel"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
        onKeyDown={onMenuKey}
      >
        {languageOptions.map((language) => {
          const href = language.available ? optionHref(language.value) : null;
          return (
            <button
              key={language.value}
              type="button"
              role="menuitemradio"
              aria-checked={language.value === locale}
              aria-disabled={!href || undefined}
              disabled={!href}
              tabIndex={open && href && language.value === locale ? 0 : -1}
              lang={language.value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!href || language.value === locale) {
                  close();
                  return;
                }
                location.assign(href);
              }}
            >
              <LanguageFlag locale={language.value} />
              <span>{language.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
