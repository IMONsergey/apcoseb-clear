import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { Icon } from './Icon';

const languages = [
  { value: 'en', label: 'English', disabled: false },
  { value: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', disabled: true },
  { value: 'zh', label: '\u4e2d\u6587', disabled: true },
] as const;

type LanguageCode = (typeof languages)[number]['value'];

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
            <path fill="#de2910" d="M0 0h24v24H0z" />
            <path
              fill="#ffde00"
              d="m6.2 4.1.9 2.1 2.3.2-1.8 1.5.6 2.2-2-1.2-2 1.2.6-2.2-1.8-1.5 2.3-.2z"
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
  const focusEnglish = () => {
    cancelFocus();
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = 0;
      const option = panel.current?.querySelector<HTMLButtonElement>('button:not(:disabled)');
      if (option && !option.closest('[inert]')) focusInPlace(option);
    });
  };
  const openMenu = (fromKeyboard = false) => {
    onOpenChange(true);
    // Pointer activation should not paint a keyboard focus ring on English.
    // Keyboard and assistive-technology activation still enter the menu.
    if (fromKeyboard) focusEnglish();
  };
  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      focusEnglish();
    }
  };

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
        aria-label="EN — Language"
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
        <LanguageFlag locale="en" />
        <span className="locale-text" lang="en">
          EN
        </span>
        <Icon name="chevron" />
      </button>

      <div
        ref={panel}
        id={panelId}
        role="menu"
        aria-label="Language"
        className="nav-panel language-panel"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
        onKeyDown={onMenuKey}
      >
        {languages.map((language) => (
          <button
            key={language.value}
            type="button"
            role="menuitemradio"
            aria-checked={language.value === 'en'}
            aria-disabled={language.disabled || undefined}
            disabled={language.disabled}
            tabIndex={open && !language.disabled ? 0 : -1}
            lang={language.value === 'zh' ? 'zh-Hans' : language.value}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (!language.disabled) close();
            }}
          >
            <LanguageFlag locale={language.value} />
            <span>{language.label}</span>
            {language.disabled && (
              <span className="language-soon" aria-hidden="true">
                SOON
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
