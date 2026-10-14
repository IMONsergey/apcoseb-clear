'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { createSignalGlobe, type GlobeOptions, type GlobeController } from './signal-globe.js';
import './signal-globe.css';
export interface SignalGlobeProps extends Omit<GlobeOptions, 'renderer'> {
  renderer?: 'auto' | 'canvas2d';
  className?: string;
  style?: CSSProperties;
  label?: string;
}
export default function SignalGlobe({
  speed = 1,
  fps = 30,
  paused = false,
  interactive = true,
  renderer = 'auto',
  pixelRatio = 1.5,
  landColor = '#6AB6C2',
  shellColor = '#FFFFFF',
  signalColor = '#269CAD',
  className = '',
  style,
  label,
}: SignalGlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    effect = useRef<GlobeController | null>(null);
  useEffect(() => {
    if (!canvas.current) return;
    effect.current = createSignalGlobe(canvas.current, {
      renderer,
      speed,
      fps,
      paused,
      interactive,
      pixelRatio,
      landColor,
      shellColor,
      signalColor,
    });
    const surface = canvas.current.closest('section');
    const forward = (event: PointerEvent) => {
      // The visual is non-interactive in document layout; forward coordinates only.
      canvas.current?.dispatchEvent(
        new PointerEvent(event.type, {
          clientX: event.clientX,
          clientY: event.clientY,
          pointerType: event.pointerType,
        }),
      );
    };
    surface?.addEventListener('pointermove', forward, { passive: true });
    surface?.addEventListener('pointerleave', forward, { passive: true });
    return () => {
      surface?.removeEventListener('pointermove', forward);
      surface?.removeEventListener('pointerleave', forward);
      effect.current?.destroy();
      effect.current = null;
    };
  }, [renderer]);
  useEffect(() => {
    effect.current?.update({
      speed,
      fps,
      paused,
      interactive,
      pixelRatio,
      landColor,
      shellColor,
      signalColor,
    });
  }, [speed, fps, paused, interactive, pixelRatio, landColor, shellColor, signalColor]);
  return (
    <div
      className={`signal-globe ${className}`.trim()}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <canvas key={renderer} ref={canvas} width={2048} height={1739} aria-hidden="true" />
    </div>
  );
}
