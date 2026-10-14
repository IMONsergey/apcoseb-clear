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
    const update = () => {
      frame = 0;
      const edge = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 25;
      let current = '';
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= edge) current = target.id;
        else break;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    const main = document.querySelector('main');
    if (main) resize.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [key]);
  return active;
}
