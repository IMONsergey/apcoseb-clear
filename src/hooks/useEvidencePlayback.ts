import { useLayoutEffect, type RefObject } from 'react';
import { useMotion } from './useMotion';

/** Keep first paint independent of the below-fold decorative presentation. */
export function useEvidencePlayback(
  ref: RefObject<HTMLDivElement | null>,
  key: string,
  paused: boolean,
  onCaption: (caption: string) => void,
) {
  const { reduced } = useMotion();
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        void import('./evidencePlayback')
          .then(({ mountEvidencePlayback }) => {
            if (!disposed) cleanup = mountEvidencePlayback(root, paused, onCaption);
          })
          .catch(() => {
            /* The complete, interactive preview remains available without autoplay. */
          });
      },
      { rootMargin: '240px' },
    );
    observer.observe(root);
    return () => {
      disposed = true;
      observer.disconnect();
      cleanup?.();
    };
  }, [ref, key, paused, reduced, onCaption]);
}
