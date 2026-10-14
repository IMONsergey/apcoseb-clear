import { useNearViewport } from '../../hooks/useNearViewport';
import { Component, Suspense, lazy, useRef, type ReactNode } from 'react';
import type { DotDirection } from '../../visuals/dots/dot-cascade';
import { useMotion } from '../../hooks/useMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTheme } from '../../theme/ThemeProvider';
const Flow = lazy(() => import('../../visuals/flow/TurquoiseFlow'));
const Waves = lazy(() => import('../../visuals/waves/IceSphereWaves'));
const Globe = lazy(() => import('../../visuals/globe/SignalGlobe'));
const Shape = lazy(() => import('../../visuals/shapes/AnimatedShape'));
const Dots = lazy(() => import('../../visuals/dots/DotCascade'));
class VisualBoundary extends Component<
  {
    children: ReactNode;
    fallback?: ReactNode | undefined;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
type Kind = 'flow' | 'waves' | 'globe' | 'rings' | 'rosette' | 'dots';
type MotionBudget = 'primary' | 'supporting';
export function Visual({
  kind,
  className = '',
  eager = false,
  direction = 'top-to-bottom',
  budget = 'primary',
  themeOverride,
}: {
  kind: Kind;
  className?: string;
  eager?: boolean;
  direction?: DotDirection;
  budget?: MotionBudget;
  themeOverride?: 'light' | 'dark';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useNearViewport(ref, '240px', eager);
  const { paused } = useMotion();
  const { theme } = useTheme();
  const visualTheme = themeOverride ?? theme;
  const constrainedMotion = useMediaQuery('(max-width: 599px), (pointer: coarse)');
  const supportingConstrained = budget === 'supporting' && constrainedMotion;
  const renderFps = supportingConstrained ? 18 : constrainedMotion ? 24 : 30;

  return (
    <div ref={ref} className={`visual visual--${kind} ${className}`} aria-hidden="true">
      <VisualBoundary fallback={<div className={`visual-fallback visual-fallback--${kind}`} />}>
        <Suspense fallback={null}>
          {mounted &&
            (kind === 'flow' ? (
              <Flow
                speed={1}
                strength={1}
                fps={renderFps}
                resolution={constrainedMotion ? 160 : 192}
                paused={paused}
                theme={visualTheme}
              />
            ) : kind === 'waves' ? (
              <Waves speed={0.7} paused={paused} theme={visualTheme} />
            ) : kind === 'globe' ? (
              <Globe
                renderer={paused ? 'canvas2d' : 'auto'}
                speed={0.85}
                fps={renderFps}
                pixelRatio={constrainedMotion ? 1 : 1.5}
                paused={paused}
                interactive={!paused}
                landColor={visualTheme === 'dark' ? '#5FAFBC' : '#6AB6C2'}
                shellColor={visualTheme === 'dark' ? '#2E3B40' : '#FFFFFF'}
                signalColor={visualTheme === 'dark' ? '#42C0CF' : '#269CAD'}
              />
            ) : kind === 'dots' ? (
              <Dots
                overlay
                direction={direction}
                fps={renderFps}
                startOpacity={supportingConstrained ? 0.14 : 0.28}
                endOpacity={supportingConstrained ? 0.008 : 0.015}
                color={visualTheme === 'dark' ? '#A9DCE2' : '#FFFFFF'}
                interactive={!paused}
              />
            ) : (
              <Shape
                kind={kind === 'rings' ? 'echo' : 'rosette'}
                color={visualTheme === 'dark' ? '#A8B5BA' : '#121314'}
                opacity={0.42}
                speed={0.75}
                strength={0.65}
                fps={renderFps}
                strokeWidth={1.35}
                paused={paused}
                interactive={!paused}
              />
            ))}
        </Suspense>
      </VisualBoundary>
    </div>
  );
}
