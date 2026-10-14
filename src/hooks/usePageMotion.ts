import { useLayoutEffect, type RefObject } from 'react';
import { useMotion } from './useMotion';

/** Small, once-only editorial reveals. Content is visible by default, including without JS. */
export function usePageMotion(ref: RefObject<HTMLElement | null>, identity: string) {
  const { reduced } = useMotion();
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    const played = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || played.has(entry.target)) continue;
          played.add(entry.target);
          observer.unobserve(entry.target);
          const animation = entry.target.animate(
            [
              { opacity: 0.94, transform: 'translateY(4px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 500, easing: 'cubic-bezier(0.39, 0.575, 0.565, 1)' },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
      },
      { threshold: 0.12 },
    );
    root
      .querySelectorAll(
        '.stage-example-journey > div, .stage-team-operations__flow > article, .stage-team-operations__business',
      )
      .forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, [ref, identity, reduced]);
}
