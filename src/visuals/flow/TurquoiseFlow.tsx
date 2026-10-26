import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  createTurquoiseFlow,
  type FlowController,
  type FlowOptions,
} from './turquoise-flow-themed';
import { observeFirstPaint } from '../firstPaint';
import './turquoise-flow.css';

interface TurquoiseFlowProps extends FlowOptions {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onReady?: ((ready: boolean) => void) | undefined;
}

/** A normal container: it can be a card, section, hero, or absolute background. */
function TurquoiseFlow({
  children,
  className = '',
  style,
  speed = 1,
  strength = 1,
  fps = 30,
  resolution = 192,
  paused = false,
  adaptive = true,
  theme = 'light',
  onReady,
}: TurquoiseFlowProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<FlowController | null>(null);
  const stopReadiness = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopReadiness.current?.();
      stopReadiness.current = null;
      controller.current?.destroy();
      controller.current = null;
    };
  }, [onReady]);

  useEffect(() => {
    const options = { speed, strength, fps, resolution, paused, adaptive, theme };
    if (controller.current) {
      controller.current.update(options);
    } else if (canvas.current) {
      controller.current = createTurquoiseFlow(canvas.current, options);
      stopReadiness.current = observeFirstPaint(canvas.current, controller.current, onReady);
    }
  }, [speed, strength, fps, resolution, paused, adaptive, theme, onReady]);

  return (
    <div className={`turquoise-flow ${className}`.trim()} style={style}>
      <canvas ref={canvas} className="turquoise-flow__canvas" aria-hidden="true" />
      {children != null && <div className="turquoise-flow__content">{children}</div>}
    </div>
  );
}

export default TurquoiseFlow;
