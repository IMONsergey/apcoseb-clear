import { useEffect, useRef, type CSSProperties } from 'react';
import {
  createAnimatedShape,
  getShapeGeometry,
  type ShapeOptions,
  type ShapeController,
} from './animated-shapes';
import './animated-shapes.css';

export interface AnimatedShapeProps extends ShapeOptions {
  size?: number | string;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  label?: string;
}
export function AnimatedShape({
  kind = 'rosette',
  speed = 1,
  strength = 1,
  fps = 30,
  paused = false,
  interactive = true,
  size = '100%',
  color,
  opacity = 0.3,
  strokeWidth = 2,
  className = '',
  style,
  label,
}: AnimatedShapeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const controller = useRef<ShapeController | null>(null);
  useEffect(() => {
    if (!svg.current) return;
    const surface = svg.current.closest<HTMLElement>('article, section');
    controller.current = createAnimatedShape(svg.current, { kind }, surface || undefined);
    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, [kind]);
  useEffect(() => {
    controller.current?.update({ kind, speed, strength, fps, paused, interactive });
  }, [kind, speed, strength, fps, paused, interactive]);
  const appearance = {
    width: size,
    color,
    ...style,
    '--shape-opacity': opacity,
    '--shape-stroke': strokeWidth,
  } as CSSProperties;
  return (
    <div
      className={`animated-shape ${className}`.trim()}
      style={appearance}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg
        ref={svg}
        className="animated-shape__svg"
        width="532"
        height="532"
        viewBox="0 0 532 532"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {getShapeGeometry(kind).map((g, i) => (
          <circle key={`${kind}-${i}`} data-shape-ring="" cx={g.cx} cy={g.cy} r={g.r} />
        ))}
      </svg>
    </div>
  );
}
export default AnimatedShape;
