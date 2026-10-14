import { useEffect, useState, type RefObject } from 'react';

/** Mount a lazy scene once as it approaches; scene adapters own offscreen suspension. */
export function useNearViewport(ref: RefObject<Element | null>, rootMargin: string, eager = false) {
  const [mounted, setMounted] = useState(eager);
  useEffect(() => {
    if (mounted || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [mounted, ref, rootMargin]);
  return mounted;
}
