import { useEffect, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/** Direction is sampled once per frame; small trackpad noise does not toggle navigation. */
export function useScrollHeader(ref: RefObject<HTMLElement | null>, locked: boolean) {
  const [state, setState] = useState({ hidden: false, compact: false });
  useEffect(() => {
    let previous = scrollY;
    let travel = 0;
    let frame = 0;
    let keyboardPinned = false;
    const update = () => {
      frame = 0;
      const y = Math.max(0, scrollY);
      const delta = y - previous;
      previous = y;
      if (Math.sign(delta) !== Math.sign(travel)) travel = delta;
      else travel += delta;
      const pinned = locked || keyboardPinned || !!ref.current?.querySelector(':focus-visible');
      setState((current) => {
        const compact = y > 80;
        const hidden =
          pinned || y < 24 ? false : Math.abs(travel) >= 12 ? travel > 0 : current.hidden;
        return compact === current.compact && hidden === current.hidden
          ? current
          : { hidden, compact };
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      travel = 0;
      previous = Math.max(0, scrollY);
      keyboardPinned = true;
      // Restore the controls before the browser computes its next native tab stop.
      flushSync(() =>
        setState((current) => (current.hidden ? { ...current, hidden: false } : current)),
      );
    };
    const anchor = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
          : null;
      const id = link?.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      const compact = target.getBoundingClientRect().top + scrollY > 160;
      // Set the smaller scroll inset before the browser starts its native anchor scroll.
      flushSync(() => setState((current) => ({ ...current, compact })));
    };
    const pointer = () => {
      keyboardPinned = false;
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('keydown', keyboard);
    document.addEventListener('click', anchor, true);
    window.addEventListener('wheel', pointer, { passive: true });
    document.addEventListener('pointerdown', pointer, { passive: true });
    document.addEventListener('touchstart', pointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('keydown', keyboard);
      document.removeEventListener('click', anchor, true);
      window.removeEventListener('wheel', pointer);
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('touchstart', pointer);
    };
  }, [locked, ref]);
  return { compact: state.compact, hidden: locked ? false : state.hidden };
}
