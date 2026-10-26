import { useEffect, useState, type RefObject } from 'react';
import { useMediaQuery } from './useMediaQuery';

const isEditing = (element: Element | null) =>
  element instanceof HTMLElement &&
  (element.isContentEditable ||
    element.matches(
      'textarea, select:not([data-language-selector]), input:not([type="radio"]):not([type="checkbox"]):not([type="button"]):not([type="submit"])',
    ));

/** A section-scoped control, without scroll lock, modal semantics or automatic focus. */
export function useBillingDock(
  rangeRef: RefObject<HTMLDivElement | null>,
  dockRef: RefObject<HTMLElement | null>,
) {
  const compact = useMediaQuery('(max-width: 1199px)');
  const [eligible, setEligible] = useState(false);
  const visible = compact && eligible;

  useEffect(() => {
    const range = rangeRef.current;
    if (!compact || !range) return;
    let frame = 0;
    const viewport = window.visualViewport;
    const measure = () => {
      frame = 0;
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      const box = range.getBoundingClientRect();
      const bottomInset = Math.max(80, Math.round(height * 0.2));
      const keyboardVisible = window.innerHeight - height > 160;
      const blocked =
        document.hidden ||
        !!document.querySelector('dialog[open]') ||
        isEditing(document.activeElement) ||
        keyboardVisible ||
        (viewport?.scale ?? 1) > 1.1;
      const dock = dockRef.current;
      const inRange = box.top < top + height - bottomInset && box.bottom > top + 24;
      if (blocked || !inRange) {
        if (dock?.dataset.occluded === 'true') dock.dataset.occluded = 'false';
        setEligible((previous) => (previous ? false : previous));
        return;
      }
      const dockHeight = dock?.offsetHeight ?? 100;
      const dockBottom = dock ? parseFloat(getComputedStyle(dock).bottom) || 12 : 12;
      const dockTop = top + height - dockHeight - dockBottom;
      // Hide instantly when the resting dock would cover a plan's price or action.
      const collision = Array.from(
        range.querySelectorAll<HTMLElement>(
          '.plan-price-block, .plan-button, .stage-plan-contact, .comparison-action',
        ),
      ).some((element) => {
        const item = element.getBoundingClientRect();
        return item.bottom > dockTop - 12 && item.top < top + height - dockBottom + 12;
      });
      if (dock && dock.dataset.occluded !== String(collision))
        dock.dataset.occluded = String(collision);
      const next = !collision;
      setEligible((previous) => (previous === next ? previous : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    // Geometry is authoritative. Firefox may keep an obsolete intersection after a breakpoint
    // changes a clipped ancestor, so observer delivery alone must not gate the only mobile switch.
    const intersection = new IntersectionObserver(schedule);
    const size = new ResizeObserver(schedule);
    const modals = new MutationObserver(schedule);
    intersection.observe(range);
    size.observe(range);
    modals.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
    });
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule, { passive: true });
    return () => {
      intersection.disconnect();
      size.disconnect();
      modals.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
      document.removeEventListener('visibilitychange', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
    };
  }, [compact, rangeRef, dockRef]);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock || !compact) return;
    const measure = () => {
      const bottom = parseFloat(getComputedStyle(dock).bottom) || 12;
      document.documentElement.style.setProperty(
        '--billing-dock-space',
        `${Math.ceil(dock.offsetHeight + bottom + 16)}px`,
      );
    };
    const resize = new ResizeObserver(measure);
    resize.observe(dock);
    measure();
    return () => {
      resize.disconnect();
      document.documentElement.style.removeProperty('--billing-dock-space');
    };
  }, [compact, dockRef]);

  useEffect(() => {
    const dock = dockRef.current;
    const html = document.documentElement;
    if (visible) html.dataset.billingDock = 'visible';
    else {
      delete html.dataset.billingDock;
      const active = document.activeElement;
      if (active instanceof HTMLElement && dock?.contains(active)) {
        active.blur();
        if (!compact)
          document
            .querySelector<HTMLElement>('.billing--desktop input:checked')
            ?.focus({ preventScroll: true });
      }
    }
    let frame = 0;
    const keepFocusVisible = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (
          !visible ||
          !dock ||
          !(active instanceof HTMLElement) ||
          dock.contains(active) ||
          !rangeRef.current?.contains(active)
        )
          return;
        const rect = active.getBoundingClientRect();
        const viewport = window.visualViewport;
        // Use the final resting position, not the translated position during entrance.
        const safeBottom =
          (viewport?.offsetTop ?? 0) +
          (viewport?.height ?? innerHeight) -
          dock.offsetHeight -
          (parseFloat(getComputedStyle(dock).bottom) || 12) -
          16;
        if (rect.bottom > safeBottom && rect.top < window.innerHeight)
          window.scrollBy({ top: rect.bottom - safeBottom, behavior: 'instant' });
      });
    };
    if (visible) {
      document.addEventListener('focusin', keepFocusVisible);
      keepFocusVisible();
    }
    return () => {
      document.removeEventListener('focusin', keepFocusVisible);
      cancelAnimationFrame(frame);
      delete html.dataset.billingDock;
    };
  }, [visible, compact, dockRef, rangeRef]);
  return visible;
}
