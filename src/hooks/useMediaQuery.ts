import { useCallback, useMemo, useSyncExternalStore } from 'react';

/** A browser preference with explicit subscription teardown and a deterministic server value. */
export function useMediaQuery(query: string) {
  const media = useMemo(
    () => (typeof window === 'undefined' ? null : window.matchMedia(query)),
    [query],
  );
  const subscribe = useCallback(
    (notify: () => void) => {
      media?.addEventListener('change', notify);
      return () => media?.removeEventListener('change', notify);
    },
    [media],
  );
  const snapshot = useCallback(() => media?.matches ?? false, [media]);
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
