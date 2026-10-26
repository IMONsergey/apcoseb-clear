import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { createDotCascade, type DotOptions, type DotController } from './dot-cascade-themed';
import { observeFirstPaint } from '../firstPaint';
import './dot-cascade.css';

interface DotCascadeProps extends DotOptions {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  overlay?: boolean;
  onReady?: ((ready: boolean) => void) | undefined;
}

function DotCascade({
  children,
  className = '',
  style,
  overlay = false,
  direction = 'top-to-bottom',
  topOpacity,
  bottomOpacity,
  spacing = 22.5,
  dotRadius = 1.1,
  startOpacity = topOpacity ?? 0.24,
  endOpacity = bottomOpacity ?? 0,
  hoverRadius = 150,
  displacement = 3,
  fps = 60,
  interactive = true,
  color = '#FFFFFF',
  onReady,
}: DotCascadeProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<DotController | null>(null);
  const stopReadiness = useRef<(() => void) | null>(null);
  useEffect(() => {
    return () => {
      stopReadiness.current?.();
      stopReadiness.current = null;
      controller.current?.destroy();
      controller.current = null;
    };
  }, [overlay, onReady]);
  useEffect(() => {
    const options = {
      spacing,
      dotRadius,
      startOpacity,
      endOpacity,
      direction,
      hoverRadius,
      displacement,
      fps,
      interactive,
      color,
    };
    if (controller.current) {
      controller.current.update(options);
    } else if (canvas.current && host.current) {
      // Decorative overlays listen on their containing section without intercepting links or scrolling.
      const surface = host.current.closest<HTMLElement>('.step-media, article, section');
      const target = overlay ? surface || host.current.parentElement || host.current : host.current;
      controller.current = createDotCascade(canvas.current, options, target);
      stopReadiness.current = observeFirstPaint(canvas.current, controller.current, onReady);
    }
  }, [
    spacing,
    dotRadius,
    startOpacity,
    endOpacity,
    direction,
    hoverRadius,
    displacement,
    fps,
    interactive,
    color,
    overlay,
    onReady,
  ]);
  const appearance = {
    ...style,
    '--dc-gap': `${spacing}px`,
    '--dc-dot-radius': `${dotRadius}px`,
    '--dc-start-opacity': startOpacity,
    '--dc-end-opacity': endOpacity,
    '--dc-direction': {
      'top-to-bottom': 'to bottom',
      'bottom-to-top': 'to top',
      'left-to-right': 'to right',
      'right-to-left': 'to left',
    }[direction],
  } as CSSProperties;
  return (
    <div
      ref={host}
      className={`dot-cascade ${overlay ? 'dot-cascade--overlay' : ''} ${className}`.trim()}
      style={appearance}
    >
      <div className="dot-cascade__fallback" aria-hidden="true" />
      <canvas ref={canvas} className="dot-cascade__canvas" aria-hidden="true" />
      {children != null && <div className="dot-cascade__content">{children}</div>}
    </div>
  );
}

export default DotCascade;
