/** Symmetric SVG breathing, with gentle hover and fixed orientation. */
const clamp = (n,lo,hi) => Math.min(hi,Math.max(lo,n));
const finite = (n,fallback) => Number.isFinite(n) ? n : fallback;
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
  if (!jobs.size && raf) {cancelAnimationFrame(raf); raf = 0;}
}
const CX = 266.334, ROSE_Y = 269.334, ECHO_Y = 268.333;
const echoRadii = [52.657,72.401,92.149,111.892,131.641,151.384,171.133,190.876,210.624];
const echoCenters = [378.3,364.554,350.808,337.062,323.317,309.571,295.825,282.079,268.333];

export function getShapeGeometry(kind = 'rosette') {
  if (kind === 'echo') return echoRadii.map((r,i) => ({cx:CX,cy:echoCenters[i],r}));
  return Array.from({length:8},(_,i) => {
    const a = Math.PI / 2 + i * Math.PI / 4;
    return {cx:CX + Math.cos(a) * 105.31, cy:ROSE_Y + Math.sin(a) * 105.31, r:105.312};
  });
}

export function createAnimatedShape(svg, options = {}, host = svg.parentElement || svg) {
  const settings = {kind:'rosette',speed:1,strength:1,fps:30,paused:false,interactive:true};
  const motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let visible = !('IntersectionObserver' in window), destroyed = false;
  let time = 0, lastTime = 0, lastDraw = -Infinity, frames = 0;
  let circles = [], base = [], io = null;
  let hover = 0, targetHover = 0, rect = null;
  const reduced = () => !!(motion && motion.matches);
  const enabled = () => !destroyed && visible && !document.hidden && !reduced() && !settings.paused && settings.strength > 0;

  function bindGeometry() {
    base = getShapeGeometry(settings.kind);
    circles = Array.from(svg.querySelectorAll('[data-shape-ring]'));
    if (circles.length !== base.length) {
      circles.forEach(circle => circle.remove());
      circles = base.map(() => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
        circle.setAttribute('data-shape-ring',''); svg.appendChild(circle); return circle;
      });
    }
    svg.setAttribute('viewBox','0 0 532 532');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    base.forEach((g,i) => {
      circles[i].setAttribute('cx',String(g.cx));
      circles[i].setAttribute('cy',String(g.cy));
      circles[i].setAttribute('r',String(g.r));
    });
  }
  function paint() {
    if (destroyed) return;
    const t = reduced() ? 0 : time;
    const period = settings.kind === 'rosette' ? 12 : 16;
    const wave = Math.sin(Math.PI * t / period);
    const pulse = wave * wave * settings.strength;
    const h = reduced() ? 0 : hover * settings.strength;
    base.forEach((g,i) => {
      if (settings.kind === 'rosette') {
        // Fixed radial axes: every petal moves only along its original ray.
        const spread = 1 + (22 * pulse + 9 * h) / 105.31;
        circles[i].setAttribute('cx',(CX + (g.cx - CX) * spread).toFixed(3));
        circles[i].setAttribute('cy',(ROSE_Y + (g.cy - ROSE_Y) * spread).toFixed(3));
        circles[i].setAttribute('r',(g.r - 5 * pulse).toFixed(3));
      } else {
        // Fixed vertical axis: x and radii are never animated.
        const offset = g.cy - ECHO_Y;
        circles[i].setAttribute('cy',(ECHO_Y + offset * (1 - .48 * pulse - .14 * h)).toFixed(3));
      }
    });
    frames++;
  }
  function stop() {unsubscribe(frame); lastTime = 0; lastDraw = -Infinity;}
  function frame(now) {
    if (!enabled()) {stop(); return;}
    const interval = 1000 / settings.fps;
    if (now - lastDraw < interval - .4) return;
    if (!Number.isFinite(lastDraw) || now - lastDraw > interval * 2) lastDraw = now;
    else lastDraw += interval;
    const dt = lastTime ? Math.min(.1,(now - lastTime) / 1000) : interval / 1000;
    lastTime = now; time += dt * settings.speed;
    hover += (targetHover - hover) * (1 - Math.exp(-3 * dt));
    if (Math.abs(targetHover - hover) < .001) hover = targetHover;
    paint();
  }
  function move(event) {
    if (!enabled() || !settings.interactive || event.pointerType === 'touch') return;
    if (!rect) rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = (event.clientY - rect.top) / rect.height * 2 - 1;
    // Cursor distance changes the amount of opening, never its orientation.
    targetHover = 1 - .45 * Math.min(1,Math.hypot(x,y));
  }
  function leave() {targetHover = 0;}
  function measure() {rect = null;}
  function onScroll() {measure(); leave();}
  function onState() {
    if (!enabled()) {stop(); hover = targetHover = 0; paint();}
    else {measure(); subscribe(frame);}
  }
  function update(next = {}) {
    if (destroyed) return;
    const oldKind = settings.kind;
    if (next.kind === 'rosette' || next.kind === 'echo') settings.kind = next.kind;
    if ('speed' in next) settings.speed = clamp(finite(next.speed,1),.2,2);
    if ('strength' in next) settings.strength = clamp(finite(next.strength,1),0,1.5);
    if ('fps' in next) settings.fps = clamp(finite(next.fps,30),15,60);
    if ('paused' in next) settings.paused = !!next.paused;
    if ('interactive' in next) settings.interactive = !!next.interactive;
    if (!settings.interactive) hover = targetHover = 0;
    if (!base.length || oldKind !== settings.kind) {time = 0; bindGeometry();}
    stop(); paint(); onState();
  }
  const pointerEvents = 'PointerEvent' in window;
  host.addEventListener(pointerEvents ? 'pointermove' : 'mousemove',move,{passive:true});
  host.addEventListener(pointerEvents ? 'pointerleave' : 'mouseleave',leave,{passive:true});
  host.addEventListener(pointerEvents ? 'pointercancel' : 'blur',leave,{passive:true});
  window.addEventListener('blur',leave);
  window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('scroll',onScroll,{capture:true,passive:true});
  document.addEventListener('visibilitychange',onState);
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => {visible = entries[0].isIntersecting; onState();}); io.observe(svg);
  }
  if (motion) {
    if (motion.addEventListener) motion.addEventListener('change',onState);
    else if (motion.addListener) motion.addListener(onState);
  }
  update(options);
  return {
    update,
    getStats: () => ({frames,kind:settings.kind,circleCount:circles.length,running:jobs.has(frame),reducedMotion:reduced(),phase:time,fpsLimit:settings.fps,hover}),
    destroy() {
      if (destroyed) return;
      stop(); destroyed = true;
      host.removeEventListener(pointerEvents ? 'pointermove' : 'mousemove',move);
      host.removeEventListener(pointerEvents ? 'pointerleave' : 'mouseleave',leave);
      host.removeEventListener(pointerEvents ? 'pointercancel' : 'blur',leave);
      window.removeEventListener('blur',leave);
      window.removeEventListener('resize',measure);
      document.removeEventListener('scroll',onScroll,true);
      document.removeEventListener('visibilitychange',onState);
      if (io) io.disconnect();
      if (motion) {
        if (motion.removeEventListener) motion.removeEventListener('change',onState);
        else if (motion.removeListener) motion.removeListener(onState);
      }
    },
  };
}
