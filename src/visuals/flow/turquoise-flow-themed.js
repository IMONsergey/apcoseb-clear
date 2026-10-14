/** Turquoise Flow — Canvas 2D, no dependencies, no image assets. */
const SPOTS = [
  // x, y, spreadX, spreadY, rotation (radians), opacity, R, G, B
  [.45577, .25100, .17569, .10493, -.74210, 1, 178, 248, 255],
  [.47315, .46683, .23210, .19203, -.73480, 1, 154, 245, 255],
  [.67950, .79179, .90000, .25794, -.10151, .809, 203, 248, 255],
  [.86079, -.4000, .12694, .93657, .50450, .457, 0, 106, 138],
  [.13660, .34827, .08000, .21780, .14553, .489, 0, 88, 114],
];
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;
let sharedBrushesLight = null;
let sharedBrushesDark = null;
let sharedSphereLight = null;
let sharedSphereDark = null;
let sharedWaveLight = null;
let sharedWaveDark = null;
const DARK_SPOT_COLORS = [
  [67, 174, 190],
  [59, 161, 179],
  [74, 179, 191],
  [7, 96, 116],
  [5, 82, 101],
];

function getSphere(theme = 'light') {
  const cached = theme === 'dark' ? sharedSphereDark : sharedSphereLight;
  if (cached) return cached;
  const size = 128;
  const sphere = document.createElement('canvas');
  sphere.width = sphere.height = size;
  const c = sphere.getContext('2d');
  // An unfocused glow: no sphere silhouette, surface, or 3D shading.
  const glow = c.createRadialGradient(size * .46, size * .44, 0, size * .50, size * .50, size * .50);
  if (theme === 'dark') {
    glow.addColorStop(0, 'rgba(78,190,204,.42)');
    glow.addColorStop(.28, 'rgba(64,176,192,.34)');
    glow.addColorStop(.60, 'rgba(48,150,168,.14)');
    glow.addColorStop(.85, 'rgba(38,128,148,.03)');
    glow.addColorStop(1, 'rgba(38,128,148,0)');
  } else {
    glow.addColorStop(0, 'rgba(192,246,252,.70)');
    glow.addColorStop(.28, 'rgba(181,241,249,.57)');
    glow.addColorStop(.60, 'rgba(166,233,243,.22)');
    glow.addColorStop(.85, 'rgba(155,226,238,.04)');
    glow.addColorStop(1, 'rgba(155,226,238,0)');
  }
  c.fillStyle = glow;
  c.fillRect(0, 0, size, size);
  if (theme === 'dark') sharedSphereDark = sphere;
  else sharedSphereLight = sphere;
  return sphere;
}

function getWave(theme = 'light') {
  const cached = theme === 'dark' ? sharedWaveDark : sharedWaveLight;
  if (cached) return cached;
  const size = 128;
  const wave = document.createElement('canvas');
  wave.width = wave.height = size;
  const c = wave.getContext('2d');
  const image = c.createImageData(size, size), rgba = image.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + .5 - size / 2) / (size / 2);
      const ny = (y + .5 - size / 2) / (size / 2);
      const r = Math.sqrt(nx * nx + ny * ny);
      // Soft light fronts, stronger on the diagonal, with no hard circle stroke.
      const ring = Math.exp(-.5 * ((r - .625) / .058) ** 2);
      const diagonal = r ? (nx - ny) / (r * Math.SQRT2) : 0;
      const angular = .30 + .70 * diagonal * diagonal;
      const p = (y * size + x) * 4;
      if (theme === 'dark') {
        rgba[p] = 68; rgba[p + 1] = 176; rgba[p + 2] = 190;
      } else {
        rgba[p] = 208; rgba[p + 1] = 249; rgba[p + 2] = 255;
      }
      rgba[p + 3] = ring * angular * 255;
    }
  }
  c.putImageData(image, 0, 0);
  if (theme === 'dark') sharedWaveDark = wave;
  else sharedWaveLight = wave;
  return wave;
}

// These brushes are created from radial gradients in code once, not loaded assets.
// Pre-rendering avoids repainting gradient primitives on every animation frame.
function getBrushes(theme = 'light') {
  const cached = theme === 'dark' ? sharedBrushesDark : sharedBrushesLight;
  if (cached) return cached;
  const brushes = SPOTS.map((spot, index) => {
    const brush = document.createElement('canvas');
    brush.width = brush.height = 96;
    const context = brush.getContext('2d');
    const g = context.createRadialGradient(48, 48, 0, 48, 48, 48);
    const color = theme === 'dark' ? DARK_SPOT_COLORS[index] : [spot[6], spot[7], spot[8]];
    const rgb = `${color[0]},${color[1]},${color[2]}`;
    // A smooth Gaussian profile; no filter(), blur, shadows, or blend modes.
    for (let i = 0; i < 25; i++) {
      const r = i / 24;
      const alpha = i === 24 ? 0 : Math.exp(-8 * r * r);
      g.addColorStop(r, `rgba(${rgb},${alpha})`);
    }
    context.fillStyle = g;
    context.fillRect(0, 0, 96, 96);
    return brush;
  });
  if (theme === 'dark') sharedBrushesDark = brushes;
  else sharedBrushesLight = brushes;
  return brushes;
}

// All instances share one rAF; the last paused/unmounted instance cancels it.
const jobs = new Set();
let raf = 0;
function tick(now) {
  raf = 0;
  jobs.forEach(job => job(now));
  if (jobs.size) raf = requestAnimationFrame(tick);
}
function subscribe(job) {
  jobs.add(job);
  if (!raf) raf = requestAnimationFrame(tick);
}
function unsubscribe(job) {
  jobs.delete(job);
  if (!jobs.size && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

/**
 * Mount on a canvas sized with CSS. Returns update(), getStats(), destroy().
 * Call destroy() when unmounting. No browser globals are used at module load.
 */
export function createTurquoiseFlow(canvas, options = {}) {
  let ctx;
  try { ctx = canvas.getContext('2d', { alpha: false }); } catch { ctx = null; }
  if (!ctx) return { update() {}, destroy() {}, getStats: () => ({ supported: false }) };

  const settings = { speed: 1, strength: 1, fps: 30, resolution: 192, paused: false, adaptive: true, theme: 'light' };
  let destroyed = false;
  let visible = !('IntersectionObserver' in window);
  let w = 0, h = 0, circleScaleY = 1, baseGradient = null, whiteVeil = null;
  let time = 0, lastTick = 0, lastDraw = -Infinity, lastReport = 0;
  let frames = 0, lastCost = 0, averageCost = 0, measuredFps = 0, reportFrames = 0, samples = 0;
  let effectiveFps = 30, effectiveResolution = 192, badFrames = 0;
  const motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const mediaMatches = () => !!(motion && motion.matches);
  const running = () => !destroyed && visible && !document.hidden && !mediaMatches() && !settings.paused && settings.speed > 0 && settings.strength > 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // Bound both axes and total pixels. Never multiply by devicePixelRatio.
    const scale = Math.min(1, effectiveResolution / Math.max(r.width, r.height));
    const nextW = Math.max(2, Math.round(r.width * scale));
    const nextH = Math.max(2, Math.round(r.height * scale));
    // Compensate for unequal CSS scaling of the rounded internal buffer.
    const nextCircleScaleY = r.width * nextH / (r.height * nextW);
    if (nextW === w && nextH === h) {
      if (Math.abs(nextCircleScaleY - circleScaleY) > .000001) {
        circleScaleY = nextCircleScaleY;
        render(mediaMatches() ? 0 : time);
      }
      return;
    }
    circleScaleY = nextCircleScaleY;
    w = nextW; h = nextH;
    canvas.width = w; canvas.height = h;
    baseGradient = ctx.createLinearGradient(0, 0, w, 0);
    baseGradient.addColorStop(0, '#003c4c');
    baseGradient.addColorStop(1, '#2396af');
    whiteVeil = ctx.createLinearGradient(0, 0, 0, h);
    // Dark lower field comes from block-second-bg-dark(1).zip, 2026-10-08.
    // Opaque from 60% down: animated light spots cannot muddy the supplied palette.
    if (settings.theme === 'dark') {
      for (const [stop, color] of [
        [0, 'rgba(0,154,180,0)'], [.36, 'rgba(0,154,180,0)'],
        [.48, 'rgba(0,145,170,.50)'], [.60, '#007A92'], [.70, '#005567'],
        [.80, '#003440'], [.90, '#0B1C21'], [.98, '#0C1113'], [1, '#0C1113'],
      ]) whiteVeil.addColorStop(stop, color);
    } else {
      for (let i = 0; i <= 48; i++) {
        const v = i / 48;
        const alpha = Math.pow(clamp((v - .38637) / (.97139 - .38637), 0, 1), 1.02082);
        whiteVeil.addColorStop(v, `rgba(246,246,246,${alpha})`);
      }
    }
    render(mediaMatches() ? 0 : time);
  }

  function render(t) {
    if (!baseGradient || destroyed) return;
    const brushes = getBrushes('light');
    const sphere = getSphere('light');
    const wave = getWave('light');
    const started = performance.now();
    const amplitude = settings.strength;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < SPOTS.length; i++) {
      const s = SPOTS[i], phase = i * 1.618;
      const waveX = Math.sin(t * .42 + phase) - Math.sin(phase);
      const waveY = Math.sin(t * .31 + phase * 1.3) - Math.sin(phase * 1.3);
      const breath = Math.sin(t * .27 + phase) - Math.sin(phase);
      const cx = (s[0] + waveX * .035 * amplitude) * w;
      const cy = (s[1] + waveY * .025 * amplitude) * h;
      const sx = s[2] * (1 + breath * .04 * amplitude);
      const sy = s[3] * (1 - breath * .035 * amplitude);
      const angle = s[4] + waveY * .035 * amplitude;
      const co = Math.cos(angle), si = Math.sin(angle);
      // The affine transform rotates an ellipse in normalized coordinates.
      ctx.setTransform(co * sx * w, si * sx * h, -si * sy * w, co * sy * h, cx, cy);
      ctx.globalAlpha = clamp(s[5] * (1 + waveX * .02 * amplitude), 0, 1);
      ctx.drawImage(brushes[i], -4, -4, 8, 8);
    }
    // The sphere and every front have the same origin. They never drift apart.
    const centerX = (.515 + .007 * Math.sin(t * .21) * amplitude) * w;
    const centerY = (.375 + .005 * Math.sin(t * .18) * amplitude) * h;
    const radius = Math.min(w, h * 1.434) * .187;
    const breathing = 1 + .025 * Math.sin(t * .65) * amplitude;
    const sphereExtent = radius * breathing / .8;
    ctx.setTransform(1, 0, 0, circleScaleY, centerX, centerY);
    ctx.globalAlpha = .13;
    ctx.drawImage(sphere, -sphereExtent, -sphereExtent, sphereExtent * 2, sphereExtent * 2);
    // A fixed four-front pool: no allocation and no accumulating particles.
    for (let i = 0; i < 4; i++) {
      const phase = (t / 13 + i / 4) % 1;
      const frontRadius = radius * (.40 + phase * 3.3);
      const fadeIn = clamp(phase / .18, 0, 1);
      const fadeOut = clamp((1 - phase) / .35, 0, 1);
      const envelope = fadeIn * fadeIn * (3 - 2 * fadeIn) * fadeOut * fadeOut * (3 - 2 * fadeOut);
      const extent = frontRadius / .625;
      const angle = -.20 + Math.sin(t * .13) * .025 * amplitude;
      const co = Math.cos(angle), si = Math.sin(angle);
      ctx.setTransform(co, si * circleScaleY, -si, co * circleScaleY, centerX, centerY);
      ctx.globalAlpha = envelope * .105;
      ctx.drawImage(wave, -extent, -extent, extent * 2, extent * 2);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = whiteVeil;
    ctx.fillRect(0, 0, w, h);
    lastCost = performance.now() - started;
    averageCost = samples ? averageCost * .92 + lastCost * .08 : lastCost;
    samples++; frames++; reportFrames++;
  }

  function frame(now) {
    if (!running()) { sync(); return; }
    if (!lastTick) lastTick = now;
    time += Math.min(100, now - lastTick) * .001 * settings.speed;
    lastTick = now;
    const interval = 1000 / effectiveFps;
    // Small tolerance avoids unintentionally turning 30 FPS into 20 FPS.
    if (now - lastDraw < interval - .75) return;
    if (!Number.isFinite(lastDraw) || now - lastDraw > interval * 2) lastDraw = now;
    else lastDraw += interval;
    render(time);
    if (!lastReport) { lastReport = now; reportFrames = 0; }
    if (now - lastReport >= 1000) {
      measuredFps = reportFrames * 1000 / (now - lastReport);
      reportFrames = 0; lastReport = now;
    }
    // If rendering itself is expensive, lower work once; no quality oscillation.
    if (settings.adaptive && lastCost > 3.5) badFrames++; else badFrames = Math.max(0, badFrames - 1);
    if (badFrames >= 20 && effectiveResolution > 112) {
      effectiveResolution = Math.max(112, Math.round(effectiveResolution * .75));
      effectiveFps = Math.min(effectiveFps, 24);
      badFrames = 0;
      resize();
    }
  }

  function sync() {
    if (running()) subscribe(frame);
    else {
      unsubscribe(frame);
      lastTick = 0; lastDraw = -Infinity; lastReport = 0; reportFrames = 0; measuredFps = 0;
    }
  }
  function onMotion() {
    if (mediaMatches()) render(0);
    sync();
  }
  function update(next = {}) {
    if (destroyed) return;
    if ('speed' in next) settings.speed = clamp(finite(next.speed, 1), 0, 4);
    if ('strength' in next) settings.strength = clamp(finite(next.strength, 1), 0, 2);
    if ('fps' in next) settings.fps = clamp(finite(next.fps, 30), 10, 60);
    if ('resolution' in next) settings.resolution = clamp(Math.round(finite(next.resolution, 192)), 64, 320);
    if ('paused' in next) settings.paused = !!next.paused;
    if ('adaptive' in next) settings.adaptive = !!next.adaptive;
    if ('theme' in next && (next.theme === 'light' || next.theme === 'dark') && next.theme !== settings.theme) { settings.theme = next.theme; w = 0; }
    if ('fps' in next || 'resolution' in next || 'adaptive' in next) {
      effectiveFps = settings.fps; effectiveResolution = settings.resolution; badFrames = 0;
    }
    resize();
    if (!running()) render(mediaMatches() ? 0 : time);
    sync();
  }

  let io = null, ro = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) resize();
      sync();
    }, { threshold: 0 });
    io.observe(canvas);
  }
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(resize);
    ro.observe(canvas);
  } else window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', sync);
  if (motion) {
    if (motion.addEventListener) motion.addEventListener('change', onMotion);
    else if (motion.addListener) motion.addListener(onMotion);
  }
  update(options);

  return {
    update,
    getStats() {
      return {
        supported: true, running: running(), reducedMotion: mediaMatches(),
        width: w, height: h, frames, fps: measuredFps, targetFps: effectiveFps,
        lastRenderMs: lastCost, averageRenderMs: averageCost,
        bufferBytes: w * h * 4,
        sharedBrushBytes: SPOTS.length * 96 * 96 * 4,
        sharedSphereWaveBytes: 2 * 128 * 128 * 4,
      };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe(frame);
      if (io) io.disconnect();
      if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', sync);
      if (motion) {
        if (motion.removeEventListener) motion.removeEventListener('change', onMotion);
        else if (motion.removeListener) motion.removeListener(onMotion);
      }
      baseGradient = whiteVeil = null;
    },
  };
}
