import { observeViewportActivity } from '../../lib/visibility';
import { useEffect, useRef } from 'react';
import { useMotion } from '../../hooks/useMotion';

/** A decorative trace for the three evidence levels below; never a live data signal. */
export function EvidenceFlow() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced, paused } = useMotion();
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    let width = 0,
      height = 0,
      frame = 0,
      visible = false,
      phase = 0,
      previous = 0;
    let ink = '',
      line = '',
      surface = '',
      gap = 32;
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const column = (width - gap * 2) / 3;
      const points = [0, 1, 2].map((i) => column / 2 + i * (column + gap));
      const y = height / 2;
      context.lineWidth = 1;
      context.strokeStyle = line;
      context.beginPath();
      context.moveTo(points[0]!, y);
      context.lineTo(points[2]!, y);
      context.stroke();
      const progress = phase * 2;
      const index = Math.min(1, Math.floor(progress));
      const x = points[index]! + (points[index + 1]! - points[index]!) * (progress - index);
      context.fillStyle = ink;
      context.beginPath();
      context.arc(x, y, 3, 0, Math.PI * 2);
      context.fill();
      for (const point of points) {
        context.fillStyle = surface;
        context.strokeStyle = ink;
        context.beginPath();
        context.arc(point, y, 5, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    };
    const tick = (time: number) => {
      phase = Math.min(1, phase + Math.max(0, time - previous) / 4200);
      previous = time;
      draw();
      if (phase < 1) frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      const style = getComputedStyle(canvas);
      gap = parseFloat(style.getPropertyValue('--layout-gap')) || 32;
      ink = style.getPropertyValue('--accent-text').trim();
      line = style.getPropertyValue('--border-subtle').trim();
      surface = style.getPropertyValue('--surface-page').trim();
      draw();
      if (visible && !document.hidden && !reduced && !paused && width > 0 && phase < 1) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const resize = new ResizeObserver(([entry]) => {
      if (!entry) return;
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      sync();
    });
    const stopActivity = observeViewportActivity(canvas, (active) => {
      visible = active;
      sync();
    });
    const theme = new MutationObserver(sync);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    resize.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      stopActivity();
      theme.disconnect();
    };
  }, [reduced, paused]);
  return <canvas className="evidence-flow" ref={ref} aria-hidden="true" />;
}
