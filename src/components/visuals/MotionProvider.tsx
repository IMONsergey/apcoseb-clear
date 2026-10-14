import type { ReactNode } from 'react';
import { MotionContext } from '../../hooks/useMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
/** No global motion switch in the design; respect the device preference automatically. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  return <MotionContext value={{ paused: reduced, reduced }}>{children}</MotionContext>;
}
