type PaintStats = { supported: boolean; frames?: number };

/** Observe the first usable paint without polling a canvas outside the viewport. */
export function observeFirstPaint(
  canvas: HTMLCanvasElement,
  controller: { getStats(): PaintStats },
  onReady?: (ready: boolean) => void,
) {
  let frame = 0;
  let ready = false;
  let visible = typeof IntersectionObserver === 'undefined';

  const stopFrame = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const schedule = () => {
    if (!ready && visible && !document.hidden && !frame) frame = requestAnimationFrame(check);
  };
  const check = () => {
    frame = 0;
    if (ready || !visible || document.hidden) return;
    const stats = controller.getStats();
    if (!stats.supported || (stats.frames ?? 0) > 0) {
      ready = true;
      canvas.dataset.renderReady = stats.supported ? 'frame' : 'fallback';
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      onReady?.(true);
    } else {
      schedule();
    }
  };
  const sync = () => {
    if (document.hidden || !visible) stopFrame();
    else schedule();
  };
  const observer =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          sync();
        });
  observer?.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  schedule();

  return () => {
    stopFrame();
    observer?.disconnect();
    document.removeEventListener('visibilitychange', sync);
    delete canvas.dataset.renderReady;
    onReady?.(false);
  };
}
