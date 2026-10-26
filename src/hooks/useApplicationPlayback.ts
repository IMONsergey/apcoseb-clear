import { useEffect, type RefObject } from 'react';
import type { ApplicationScene } from '../components/visuals/application/ApplicationFrame';
import { useLocale } from '../i18n/context';
import { useMotion } from './useMotion';

/** Load motion near the viewport; the complete static scene never depends on it. */
export function useApplicationPlayback(
  ref: RefObject<HTMLDivElement | null>,
  scene: ApplicationScene,
  enabled: boolean,
) {
  const { locale } = useLocale();
  const { reduced } = useMotion();
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled || reduced) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('../components/visuals/application/applicationPlayback')
      .then(({ startApplicationPlayback }) => {
        if (!disposed) {
          const playback = startApplicationPlayback(root, scene);
          cleanup = () => playback.dispose();
        }
      })
      .catch(() => {
        /* The static scene remains readable if its optional motion cannot load. */
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [ref, scene, enabled, reduced, locale]);
}
