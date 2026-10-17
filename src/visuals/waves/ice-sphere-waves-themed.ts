export interface IceWavesOptions {
  speed?: number;
  paused?: boolean;
  theme?: 'light' | 'dark';
}
export interface IceWavesStats {
  supported: boolean;
  running?: boolean;
  width?: number;
  height?: number;
  frames?: number;
  phase?: number;
  renderMs?: number;
  targetFps?: number;
}
export interface IceWavesController {
  update(options?: IceWavesOptions): void;
  destroy(): void;
  getStats(): IceWavesStats;
}

type Theme = NonNullable<IceWavesOptions['theme']>;
type Spot = readonly [number, number, number, number, number, number, number, number];
type Rgb = readonly [number, number, number];
type FrameJob = (now: number) => void;
type IceWavesSettings = Required<IceWavesOptions>;
interface Brushes {
  brushes: HTMLCanvasElement[];
  ring: HTMLCanvasElement;
}

const SPOTS: readonly Spot[] = [
  [0.035896, 0.651867, 0.122553, 0.172182, 1, 117, 187, 206],
  [0.248398, 0.406048, 0.436083, 0.098348, 0.481522, 183, 232, 241],
  [0.758052, 0.703249, 0.356924, 0.160685, 0.998864, 204, 236, 244],
  [0.278487, 0.623488, 0.180636, 0.085598, 1, 186, 234, 242],
  [0.218842, 0.665581, 0.06738, 0.145616, 0.732305, 255, 255, 255],
  [0.524621, 0.400452, 0.187462, 0.066403, 0.791651, 255, 255, 255],
  [0.524516, 0.881, 0.142619, 0.047916, 0.645101, 255, 255, 255],
  [0.497262, 0.640925, 0.086785, 0.066244, 1, 250, 255, 254],
  [0.760202, 0.634622, 0.084352, 0.222314, 0.639308, 255, 255, 255],
];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
const jobs = new Set<FrameJob>();
let raf = 0;
function tick(now: number) {
  raf = 0;
  jobs.forEach((fn) => fn(now));
  if (jobs.size) raf = requestAnimationFrame(tick);
}
function add(fn: FrameJob) {
  jobs.add(fn);
  if (!raf) raf = requestAnimationFrame(tick);
}
function remove(fn: FrameJob) {
  jobs.delete(fn);
  if (!jobs.size && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}
let sharedBrushesLight: Brushes | null = null,
  sharedBrushesDark: Brushes | null = null;
const DARK_COLORS: readonly Rgb[] = [
  [24, 66, 76],
  [33, 82, 92],
  [29, 72, 83],
  [35, 86, 96],
  [43, 96, 106],
  [31, 78, 88],
  [28, 70, 80],
  [39, 93, 103],
  [30, 76, 86],
];
function getBrushes(theme: Theme = 'light'): Brushes {
  const cached = theme === 'dark' ? sharedBrushesDark : sharedBrushesLight;
  if (cached) return cached;
  // These tiny brushes are drawn by code once. No uploaded image is used.
  const brushes = SPOTS.map((s) => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    const image = ctx.createImageData(128, 128),
      data = image.data;
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 128; x++) {
        const dx = (x + 0.5 - 64) / 16,
          dy = (y + 0.5 - 64) / 16,
          i = (y * 128 + x) * 4;
        const color = theme === 'dark' ? DARK_COLORS[SPOTS.indexOf(s)] : [s[5], s[6], s[7]];
        if (!color) throw new Error('Missing spot color');
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = Math.exp(-0.5 * (dx * dx + dy * dy)) * 255;
      }
    ctx.putImageData(image, 0, 0);
    return c;
  });
  const ring = document.createElement('canvas');
  ring.width = ring.height = 128;
  const rc = ring.getContext('2d');
  if (!rc) throw new Error('Canvas 2D is unavailable');
  const ri = rc.createImageData(128, 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const nx = (x + 0.5 - 64) / 64,
        ny = (y + 0.5 - 64) / 64,
        r = Math.hypot(nx, ny),
        i = (y * 128 + x) * 4;
      const weight = r ? 0.8 + 0.2 * ((nx - ny) / (r * Math.SQRT2)) ** 2 : 0.8;
      // Broad, low-opacity light only: no dark trough or sharply defined contour.
      const alpha =
        (Math.exp(-0.5 * ((r - 0.625) / 0.095) ** 2) * 0.2 +
          Math.exp(-0.5 * ((r - 0.625) / 0.17) ** 2) * 0.04) *
        weight;
      const ringColor: Rgb = theme === 'dark' ? [62, 117, 128] : [255, 255, 255];
      ri.data[i] = ringColor[0];
      ri.data[i + 1] = ringColor[1];
      ri.data[i + 2] = ringColor[2];
      ri.data[i + 3] = alpha * 255;
    }
  rc.putImageData(ri, 0, 0);
  const result = { brushes, ring };
  if (theme === 'dark') sharedBrushesDark = result;
  else sharedBrushesLight = result;
  return result;
}
export function createIceWaves(
  canvas: HTMLCanvasElement,
  options: IceWavesOptions = {},
): IceWavesController {
  let maybeContext: CanvasRenderingContext2D | null;
  try {
    maybeContext = canvas.getContext('2d', { alpha: false });
  } catch {
    maybeContext = null;
  }
  if (!maybeContext) return { update() {}, destroy() {}, getStats: () => ({ supported: false }) };
  const ctx = maybeContext;
  const settings: IceWavesSettings = { speed: 1, paused: false, theme: 'light' };
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let width = 0,
    height = 0,
    correction = 1,
    veil: CanvasGradient | null = null,
    visible = true,
    destroyed = false,
    pagePaused = false;
  let phase = 0,
    last = 0,
    lastDraw = -Infinity,
    frames = 0,
    cost = 0;
  let io: IntersectionObserver | null = null,
    ro: ResizeObserver | null = null;
  const reduced = () => !!motion?.matches;
  const enabled = () =>
    !destroyed &&
    width > 0 &&
    height > 0 &&
    visible &&
    !pagePaused &&
    !document.hidden &&
    !reduced() &&
    !settings.paused &&
    settings.speed > 0;
  function draw(time: number) {
    if (destroyed || !width || !height || !veil) return;
    const { brushes, ring } = getBrushes(settings.theme);
    const start = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = settings.theme === 'dark' ? '#0d1113' : '#ffffff';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < SPOTS.length; i++) {
      const s = SPOTS[i],
        brush = brushes[i],
        p = i * 1.61;
      if (!s || !brush) continue;
      const driftX = (Math.sin(time * 0.14 + p) - Math.sin(p)) * 0.008;
      const driftY = (Math.sin(time * 0.11 + p * 1.3) - Math.sin(p * 1.3)) * 0.005;
      const breath = 1 + (Math.sin(time * 0.18 + p) - Math.sin(p)) * 0.025;
      const sx = s[2] * width * breath,
        sy = s[3] * height * (2 - breath);
      ctx.globalAlpha = s[4] * (settings.theme === 'dark' ? 0.72 : 1);
      ctx.drawImage(
        brush,
        (s[0] + driftX) * width - sx * 4,
        (s[1] + driftY) * height - sy * 4,
        sx * 8,
        sy * 8,
      );
    }
    const origin = SPOTS[7],
      p = 7 * 1.61;
    if (!origin) return;
    const cx = (origin[0] + (Math.sin(time * 0.14 + p) - Math.sin(p)) * 0.008) * width;
    const cy = (origin[1] + (Math.sin(time * 0.11 + p * 1.3) - Math.sin(p * 1.3)) * 0.005) * height;
    ctx.setTransform(1, 0, 0, correction, cx, cy);
    for (let i = 0; i < 3; i++) {
      const age = (time / 22 + 0.08 + i / 3) % 1;
      const radius = width * (0.035 + 0.53 * age),
        extent = radius / 0.625;
      ctx.globalAlpha =
        (settings.theme === 'dark' ? 0.32 : 0.65) *
        smooth(0, 0.18, age) *
        (1 - smooth(0.55, 1, age));
      ctx.drawImage(ring, -extent, -extent, extent * 2, extent * 2);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);
    frames++;
    cost = cost * 0.9 + (performance.now() - start) * 0.1;
  }
  function stop() {
    remove(frame);
    last = 0;
    lastDraw = -Infinity;
  }
  function sync() {
    if (destroyed) return;
    if (reduced()) draw(0);
    if (enabled()) add(frame);
    else stop();
  }
  function resize() {
    if (destroyed) return;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) {
      width = height = 0;
      stop();
      return;
    }
    const scale = Math.min(1, 288 / Math.max(r.width, r.height));
    width = Math.max(2, Math.round(r.width * scale));
    height = Math.max(2, Math.round(r.height * scale));
    correction = (r.width * height) / (r.height * width);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    veil = ctx.createLinearGradient(0, 0, 0, height);
    for (let i = 0; i <= 80; i++) {
      const y = i / 80,
        a = 1 - smooth(0.17, 0.24, y) * smooth(0, 0.07, 1 - y);
      veil.addColorStop(
        y,
        settings.theme === 'dark'
          ? 'rgba(13,17,19,' + Math.min(1, a + 0.16) + ')'
          : 'rgba(255,255,255,' + a + ')',
      );
    }
    draw(reduced() ? 0 : phase);
    sync();
  }
  function frame(now: number) {
    if (!enabled()) {
      stop();
      return;
    }
    const interval = 1000 / 24;
    if (now - lastDraw < interval - 0.5) return;
    if (!Number.isFinite(lastDraw) || now - lastDraw > interval * 2) lastDraw = now;
    else lastDraw += interval;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : interval / 1000;
    last = now;
    phase += dt * settings.speed;
    draw(phase);
  }
  function update(next: IceWavesOptions = {}) {
    if (destroyed) return;
    if ('speed' in next)
      settings.speed = clamp(
        typeof next.speed === 'number' && Number.isFinite(next.speed) ? next.speed : 1,
        0,
        3,
      );
    if ('paused' in next) settings.paused = !!next.paused;
    if ('theme' in next && (next.theme === 'light' || next.theme === 'dark'))
      settings.theme = next.theme;
    stop();
    resize();
    draw(reduced() ? 0 : phase);
    sync();
  }
  function hide() {
    pagePaused = true;
    sync();
  }
  function show() {
    pagePaused = false;
    resize();
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  window.addEventListener('resize', resize, { passive: true });
  if (motion?.addEventListener) motion.addEventListener('change', sync);
  else motion?.addListener?.(sync);
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(canvas);
  }
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(resize);
    ro.observe(canvas);
  }
  resize();
  update(options);
  return {
    update,
    getStats: () => ({
      supported: true,
      running: jobs.has(frame),
      width,
      height,
      frames,
      phase,
      renderMs: cost,
      targetFps: 24,
    }),
    destroy() {
      if (destroyed) return;
      stop();
      destroyed = true;
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', show);
      window.removeEventListener('resize', resize);
      if (motion?.removeEventListener) motion.removeEventListener('change', sync);
      else motion?.removeListener?.(sync);
      veil = null;
    },
  };
}
