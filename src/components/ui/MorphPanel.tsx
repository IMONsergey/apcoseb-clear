import { useEffect, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { useMotion } from '../../hooks/useMotion';
import './MorphPanel.css';

/** Keep one opaque content state; animate only natural height, never wipes or text overlays. */
export function MorphPanel({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();
  const measure = useRef<(() => void) | null>(null);
  // Initial content uses its natural height; only later changes need a pre-paint measurement.
  useEffect(() => {
    const outer = frame.current;
    const inner = content.current;
    if (!outer || !inner) return;
    const initial = inner.getBoundingClientRect();
    let height = initial.height;
    let width = initial.width;
    let animation: Animation | undefined;
    let resizeFrame = 0;
    const resize = () => {
      const next = inner.getBoundingClientRect();
      if (Math.abs(next.height - height) < 0.5 && Math.abs(next.width - width) < 0.5) return;
      const previous =
        animation?.playState === 'running' ? parseFloat(getComputedStyle(outer).height) : height;
      const resized = Math.abs(next.width - width) > 1;
      height = next.height;
      width = next.width;
      animation?.cancel();
      // A nested morph already drives the parent's natural layout continuously.
      const nested = inner.querySelector('[data-morphing="true"]');
      if (reduced || resized || nested || !height) {
        outer.style.height = '';
        outer.dataset.morphing = 'false';
        return;
      }
      outer.dataset.morphing = 'true';
      animation = outer.animate([{ height: `${previous}px` }, { height: `${height}px` }], {
        duration: 480,
        easing: 'cubic-bezier(0.37, 0, 0.63, 1)',
      });
      animation.onfinish = () => {
        outer.dataset.morphing = 'false';
      };
    };
    measure.current = resize;
    // Observer-driven size changes can include fractional font/layout adjustments.
    // Commit their height animation in the next frame to avoid a resize delivery loop.
    const observer = new ResizeObserver(() => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    });
    observer.observe(inner);
    return () => {
      measure.current = null;
      observer.disconnect();
      cancelAnimationFrame(resizeFrame);
      animation?.cancel();
      outer.style.height = '';
      delete outer.dataset.morphing;
    };
  }, [reduced]);

  // Freeze before paint on React updates; the observer also covers fonts and child changes.
  useLayoutEffect(() => {
    measure.current?.();
  });

  return (
    <div {...props} ref={frame} className={'morph-panel ' + className}>
      <div ref={content} className="morph-panel__content">
        {children}
      </div>
    </div>
  );
}
