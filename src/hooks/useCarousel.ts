import { useCallback, useEffect, useRef, useState } from 'react';
import { useMotion } from './useMotion';

/** Snap positions come from the actual scroll container; rapid clicks have their own target. */
export function useCarousel() {
  const track = useRef<HTMLUListElement>(null);
  const requested = useRef<number | null>(null);
  const stops = useRef<number[]>([0]);
  const [position, setPosition] = useState(0);
  const [positions, setPositions] = useState(3);
  const { paused } = useMotion();
  const update = useCallback(() => {
    const element = track.current;
    const first = element?.firstElementChild;
    if (!element || !(first instanceof HTMLElement)) return;
    const step =
      first.getBoundingClientRect().width + (parseFloat(getComputedStyle(element).gap) || 20);
    const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
    const count = Math.max(1, Math.round(maximum / step) + 1);
    stops.current = Array.from({ length: count }, (_, index) =>
      index === count - 1 ? maximum : Math.min(maximum, index * step),
    );
    const closest = stops.current.reduce(
      (best, stop, index, values) =>
        Math.abs(stop - element.scrollLeft) < Math.abs((values[best] ?? 0) - element.scrollLeft)
          ? index
          : best,
      0,
    );
    setPositions(count);
    setPosition(closest);
    if (
      requested.current !== null &&
      Math.abs(element.scrollLeft - (stops.current[requested.current] ?? maximum)) < 2
    )
      requested.current = null;
  }, []);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const resize = new ResizeObserver(() => {
      requested.current = null;
      update();
    });
    resize.observe(element);
    const manualScroll = () => {
      requested.current = null;
    };
    element.addEventListener('scroll', update, { passive: true });
    element.addEventListener('pointerdown', manualScroll, { passive: true });
    element.addEventListener('wheel', manualScroll, { passive: true });
    update();
    return () => {
      resize.disconnect();
      element.removeEventListener('scroll', update);
      element.removeEventListener('pointerdown', manualScroll);
      element.removeEventListener('wheel', manualScroll);
    };
  }, [update]);
  function goTo(index: number) {
    const element = track.current;
    if (!element) return;
    const next = Math.max(0, Math.min(stops.current.length - 1, index));
    const left = stops.current[next];
    if (left === undefined) return;
    requested.current = next;
    element.scrollTo({ left, behavior: paused ? 'instant' : 'smooth' });
  }
  function move(direction: number) {
    goTo((requested.current ?? position) + direction);
  }
  return { track, position, positions, move, goTo };
}
