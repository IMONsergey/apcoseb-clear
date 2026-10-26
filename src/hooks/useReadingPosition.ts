import { useEffect, useState } from 'react';

/** Follow the section at the reading edge, including long sections and reverse scrolling. */
export function useReadingPosition(ids: readonly string[]) {
  const [active, setActive] = useState('');
  const key = ids.join('|');
  useEffect(() => {
    if (!key) return;
    const targets = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    let frame = 0;
    let layoutChanged = true;
    let edge = 0;
    let positions: { id: string; top: number }[] = [];
    const update = () => {
      frame = 0;
      if (layoutChanged) {
        edge = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 25;
        positions = targets.map((target) => ({
          id: target.id,
          top: target.getBoundingClientRect().top + scrollY,
        }));
        layoutChanged = false;
      }
      let current = '';
      for (const target of positions) {
        if (target.top <= scrollY + edge) current = target.id;
        else break;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      layoutChanged = true;
      schedule();
    };
    const resize = new ResizeObserver(measure);
    const main = document.querySelector('main');
    if (main) resize.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
    };
  }, [key]);
  return active;
}
