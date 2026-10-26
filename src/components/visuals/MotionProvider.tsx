import { useMemo, type ReactNode } from 'react';
import { MotionContext } from '../../hooks/useMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
/** No global motion switch in the design; respect the device preference automatically. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const state = useMemo(() => ({ paused: reduced, reduced }), [reduced]);
  return <MotionContext value={state}>{children}</MotionContext>;
}
