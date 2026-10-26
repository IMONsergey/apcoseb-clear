import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './Icon';
import './SelectField.css';

type SelectOption = { value: string; label: string };
type Props = {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};
const keySteps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10 };

/** Select-only combobox. The hidden select retains form data and required validation. */
export function SelectField({
  name,
  label,
  placeholder,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const id = useId();
  const labelId = id + '-label';
  const listboxId = id + '-options';
  const errorId = id + '-error';
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLUListElement>(null);
  const search = useRef({ text: '', time: 0 });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];
  const invalid = attempted && required && !selected;

  function openList(index = Math.max(selectedIndex, 0)) {
    if (disabled || !options.length) return;
    search.current = { text: '', time: 0 };
    setActiveIndex(index);
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    setAttempted(false);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    const button = trigger.current;
    const listbox = panel.current;
    if (!open || !button || !listbox) return;
    const control = button.parentElement!;
    const viewport = window.visualViewport;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const update = () => {
      const box = button.getBoundingClientRect();
      const viewportOffset = viewport?.offsetTop ?? 0;
      const topInset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const viewportTop = viewportOffset + topInset;
      const viewportBottom = viewportOffset + (viewport?.height ?? innerHeight);
      const below = viewportBottom - box.bottom - 12;
      const above = box.top - viewportTop - 12;
      const preferAbove = below < Math.min(listbox.scrollHeight, 320) && above > below;
      control.dataset.side = preferAbove ? 'above' : 'below';
      control.style.setProperty(
        '--select-available-height',
        Math.max(44, preferAbove ? above : below) + 'px',
      );
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(button);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    viewport?.addEventListener('resize', update);
    return () => {
      resize.disconnect();
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      viewport?.removeEventListener('resize', update);
    };
  }, [open]);

  useLayoutEffect(() => {
    const listbox = panel.current;
    const option = listbox?.children[activeIndex] as HTMLElement | undefined;
    if (!open || !listbox || !option) return;
    const top = option.offsetTop - listbox.clientTop;
    const bottom = top + option.offsetHeight;
    if (top < listbox.scrollTop) listbox.scrollTop = top;
    else if (bottom > listbox.scrollTop + listbox.clientHeight)
      listbox.scrollTop = bottom - listbox.clientHeight;
  }, [open, activeIndex]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (key === 'Tab') {
      if (open) commit(activeIndex);
      return;
    }
    if (event.altKey && key === 'ArrowUp') {
      if (open) {
        event.preventDefault();
        commit(activeIndex);
      }
      return;
    }
    const step = keySteps[key] ?? 0;
    if (key === 'Home' || key === 'End' || step) {
      event.preventDefault();
      const last = options.length - 1;
      openList(
        key === 'Home'
          ? 0
          : key === 'End'
            ? last
            : open
              ? Math.max(0, Math.min(last, activeIndex + step))
              : Math.max(selectedIndex, 0),
      );
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (open) commit(activeIndex);
      else openList();
      return;
    }
    if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    const now = Date.now();
    const letter = key.toLocaleLowerCase();
    const text = (now - search.current.time < 700 ? search.current.text : '') + letter;
    search.current = { text, time: now };
    const query = [...text].every((character) => character === letter) ? letter : text;
    const start = (open ? activeIndex : selectedIndex) + (query.length === 1 ? 1 : 0);
    for (let offset = 0; offset < options.length; offset++) {
      const index = (Math.max(start, 0) + offset) % options.length;
      if (options[index]!.label.toLocaleLowerCase().startsWith(query)) {
        setActiveIndex(index);
        setOpen(true);
        break;
      }
    }
  }

  return (
    <div
      ref={root}
      className="select-field"
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label id={labelId} htmlFor={id} className="select-field__label">
        {label}
      </label>
      <div className="select-field__control" data-open={open}>
        <select
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          hidden
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => onChange(event.target.value)}
          onInvalid={(event) => {
            event.preventDefault();
            setAttempted(true);
            if (event.currentTarget.form?.querySelector(':invalid') === event.currentTarget) {
              trigger.current?.focus();
              openList();
            }
          }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          ref={trigger}
          id={id}
          type="button"
          role="combobox"
          className="select-field__trigger"
          disabled={disabled}
          aria-labelledby={labelId}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
        >
          <span className="select-field__value" data-placeholder={!selected}>
            {selected?.label ?? placeholder}
          </span>
          <Icon name="chevron" />
        </button>
        <ul
          ref={panel}
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          className="select-field__listbox"
          hidden={!open}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              data-value={option.value}
              data-active={index === activeIndex}
              data-selected={option.value === value}
              className="select-field__option"
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={(event) => {
                if (event.pointerType === 'mouse') setActiveIndex(index);
              }}
              onClick={() => commit(index)}
            >
              <span>{option.label}</span>
              <Icon name="check" className="select-field__check" width={18} height={18} />
            </li>
          ))}
        </ul>
      </div>
      {invalid && (
        <p id={errorId} className="select-field__error" role="alert">
          {placeholder}
        </p>
      )}
    </div>
  );
}
