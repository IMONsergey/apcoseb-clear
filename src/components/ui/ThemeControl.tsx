import { useId, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { useTheme, type ThemeMode } from '../../theme/ThemeProvider';
import { Icon } from './Icon';

const options: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function ThemeOptions({ compact = false, onSelect }: { compact?: boolean; onSelect?: () => void }) {
  const { mode, setMode } = useTheme();
  const name = useId();
  return (
    <div
      className={compact ? 'theme-segmented' : 'theme-menu-options'}
      role={compact ? 'radiogroup' : 'group'}
      aria-label="Appearance"
    >
      {options.map((option) =>
        compact ? (
          <label key={option.value} data-active={mode === option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={mode === option.value}
              onChange={() => setMode(option.value)}
            />
            <span>{option.label}</span>
            {mode === option.value && (
              <span className="theme-check" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
                  <path
                    d="m3.75 9.25 3.35 3.35 7.15-7.15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </label>
        ) : (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={mode === option.value}
            data-active={mode === option.value}
            tabIndex={-1}
            onClick={() => {
              setMode(option.value);
              onSelect?.();
            }}
          >
            <span>{option.label}</span>
            {mode === option.value && (
              <span className="theme-check" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
                  <path
                    d="m3.75 9.25 3.35 3.35 7.15-7.15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </button>
        ),
      )}
    </div>
  );
}

export function ThemeMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusLast = useRef(false);
  const focusMenuOnOpen = useRef(false);
  useLayoutEffect(() => {
    if (!open || !focusMenuOnOpen.current) return;
    // Wait until the committed disclosure has its visible style before moving focus.
    const frame = requestAnimationFrame(() => {
      const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
      buttons?.[focusLast.current ? buttons.length - 1 : 0]?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const close = () => {
    onOpenChange(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const openMenu = (last = false, fromKeyboard = false) => {
    focusLast.current = last;
    // Leave pointer focus on the trigger; only keyboard opening enters the menu.
    focusMenuOnOpen.current = fromKeyboard;
    onOpenChange(true);
    if (open) {
      const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
      buttons?.[last ? buttons.length - 1 : 0]?.focus({ preventScroll: true });
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
    if (event.key === 'Tab') {
      // Restore the trigger before native Tab chooses the next control outside the menu.
      close();
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      const buttons = Array.from(
        panel.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
      );
      if (!buttons.length) return;
      event.preventDefault();
      const current = buttons.findIndex((button) => button === document.activeElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? buttons.length - 1
            : current < 0
              ? 0
              : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus({ preventScroll: true });
    }
  };
  return (
    <div
      className="theme-control theme-control--desktop"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="icon-button theme-trigger"
        aria-label="Appearance"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={(event) => (open ? close() : openMenu(false, event.detail === 0))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu(event.key === 'ArrowUp', true);
          }
        }}
      >
        <Icon name="appearance" />
      </button>
      <div
        ref={panel}
        id={id}
        className="nav-panel theme-panel"
        role="menu"
        aria-label="Appearance"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
        onKeyDown={onKeyDown}
      >
        <p className="eyebrow">APPEARANCE</p>
        <ThemeOptions onSelect={close} />
      </div>
    </div>
  );
}

export function MobileThemeControl() {
  return (
    <div className="mobile-theme-control">
      <p className="eyebrow">APPEARANCE</p>
      <ThemeOptions compact />
    </div>
  );
}
