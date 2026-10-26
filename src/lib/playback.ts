/** A cancellable clock whose elapsed time advances only while its owner is active. */
export function createPlaybackClock(render: (elapsed: number) => void) {
  let elapsed = 0;
  let previous: number | null = null;
  let frame = 0;
  let playing = false;
  let disposed = false;

  function tick(now: number) {
    frame = 0;
    if (!playing || disposed) return;
    if (previous !== null) elapsed += Math.max(0, now - previous);
    previous = now;
    render(elapsed);
    if (playing && !disposed) frame = requestAnimationFrame(tick);
  }

  function setPlaying(next: boolean) {
    if (disposed || playing === next) return;
    playing = next;
    previous = null;
    if (playing) frame = requestAnimationFrame(tick);
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  return {
    setPlaying,
    refresh() {
      if (!disposed) render(elapsed);
    },
    reset() {
      setPlaying(false);
      elapsed = 0;
    },
    dispose() {
      setPlaying(false);
      disposed = true;
    },
  };
}

export const playbackProgress = (time: number, start: number, duration: number) =>
  Math.max(0, Math.min(1, (time - start) / duration));

export const easeInOutCubic = (progress: number) =>
  progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
