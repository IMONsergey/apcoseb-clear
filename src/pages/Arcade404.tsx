import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useLocale } from '../i18n/context';

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 620;
const PADDLE_Y = 564;
const PADDLE_HEIGHT = 14;
const PADDLE_WIDTH = 124;
const BALL_RADIUS = 7;
const INITIAL_LIVES = 3;
const BASE_SPEED = 380;
const MAX_SPEED = 520;

const GLYPHS = [
  ['10010', '10010', '10010', '11111', '00010', '00010', '00010'],
  ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  ['10010', '10010', '10010', '11111', '00010', '00010', '00010'],
] as const;

type GamePhase = 'idle' | 'running' | 'paused' | 'won' | 'lost';
type PowerUpType = 'wide' | 'multi' | 'shield' | 'slow';

type Ball = { x: number; y: number; vx: number; vy: number };
type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  digit: number;
};
type FallingPowerUp = { x: number; y: number; type: PowerUpType };
type Particle = { x: number; y: number; vx: number; vy: number; life: number };
type TimedPowerUp = { type: PowerUpType; seconds?: number; count?: number };

type Engine = {
  paddle: { x: number; width: number };
  balls: Ball[];
  bricks: Brick[];
  falling: FallingPowerUp[];
  particles: Particle[];
  score: number;
  lives: number;
  destroyed: number;
  nextDropAt: number;
  dropIndex: number;
  served: boolean;
  slowed: boolean;
  wideUntil: number;
  shieldUntil: number;
  slowUntil: number;
};

type Hud = {
  score: number;
  lives: number;
  remaining: number;
  paddleX: number;
  served: boolean;
  falling: number;
  active: TimedPowerUp[];
};

type Palette = {
  card: string;
  text: string;
  accent: string;
  border: string;
};

const POWER_UP_ORDER: readonly PowerUpType[] = ['wide', 'multi', 'shield', 'slow'];

function makeBricks(): Brick[] {
  const bricks: Brick[] = [];
  const brickWidth = 36;
  const brickHeight = 20;
  const columnStep = 43;
  const rowStep = 29;
  const digitStep = 250;
  const startX = 126;
  const startY = 82;

  GLYPHS.forEach((glyph, digit) => {
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((cell, columnIndex) => {
        if (cell !== '1') return;
        bricks.push({
          x: startX + digit * digitStep + columnIndex * columnStep,
          y: startY + rowIndex * rowStep,
          width: brickWidth,
          height: brickHeight,
          alive: true,
          digit,
        });
      });
    });
  });
  return bricks;
}

const TOTAL_BRICKS = makeBricks().length;

function dockedBall(paddle: Engine['paddle']): Ball {
  return {
    x: paddle.x + paddle.width / 2,
    y: PADDLE_Y - BALL_RADIUS - 3,
    vx: 218,
    vy: -311,
  };
}

function makeEngine(): Engine {
  const paddle = { x: (WORLD_WIDTH - PADDLE_WIDTH) / 2, width: PADDLE_WIDTH };
  return {
    paddle,
    balls: [dockedBall(paddle)],
    bricks: makeBricks(),
    falling: [],
    particles: [],
    score: 0,
    lives: INITIAL_LIVES,
    destroyed: 0,
    nextDropAt: 2,
    dropIndex: 0,
    served: false,
    slowed: false,
    wideUntil: 0,
    shieldUntil: 0,
    slowUntil: 0,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeBall(ball: Ball, requestedSpeed?: number) {
  const currentSpeed = Math.hypot(ball.vx, ball.vy) || BASE_SPEED;
  const speed = clamp(requestedSpeed ?? currentSpeed, BASE_SPEED * 0.7, MAX_SPEED);
  let horizontal = ball.vx / currentSpeed;
  let vertical = ball.vy / currentSpeed;
  if (Math.abs(vertical) < 0.34) {
    vertical = Math.sign(vertical || -1) * 0.34;
    horizontal = Math.sign(horizontal || 1) * Math.sqrt(1 - vertical * vertical);
  }
  const magnitude = Math.hypot(horizontal, vertical);
  ball.vx = (horizontal / magnitude) * speed;
  ball.vy = (vertical / magnitude) * speed;
}

function circleHitsRect(ball: Ball, radius: number, rect: Brick | Engine['paddle']) {
  const height = 'height' in rect ? rect.height : PADDLE_HEIGHT;
  const y = 'y' in rect ? rect.y : PADDLE_Y;
  const nearestX = clamp(ball.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(ball.y, y, y + height);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

function activePowerUps(engine: Engine, now: number): TimedPowerUp[] {
  const effects: TimedPowerUp[] = [];
  if (engine.wideUntil > now)
    effects.push({ type: 'wide', seconds: Math.ceil((engine.wideUntil - now) / 1000) });
  if (engine.balls.length > 1) effects.push({ type: 'multi', count: engine.balls.length });
  if (engine.shieldUntil > now)
    effects.push({ type: 'shield', seconds: Math.ceil((engine.shieldUntil - now) / 1000) });
  if (engine.slowUntil > now)
    effects.push({ type: 'slow', seconds: Math.ceil((engine.slowUntil - now) / 1000) });
  return effects;
}

function makeHud(engine: Engine, now = performance.now()): Hud {
  return {
    score: engine.score,
    lives: engine.lives,
    remaining: TOTAL_BRICKS - engine.destroyed,
    paddleX: Math.round(engine.paddle.x),
    served: engine.served,
    falling: engine.falling.length,
    active: activePowerUps(engine, now),
  };
}

function applyPowerUp(engine: Engine, type: PowerUpType, now: number) {
  if (type === 'wide') {
    engine.paddle.width = 188;
    engine.paddle.x = clamp(engine.paddle.x, 24, WORLD_WIDTH - 24 - engine.paddle.width);
    engine.wideUntil = now + 11_000;
    return;
  }
  if (type === 'multi') {
    const sources = engine.balls.length ? engine.balls.slice(0, 2) : [dockedBall(engine.paddle)];
    const additions = sources.flatMap((ball) => [
      { ...ball, vx: ball.vx * 0.78 - ball.vy * 0.28, vy: ball.vy * 0.82 },
      { ...ball, vx: ball.vx * 0.78 + ball.vy * 0.28, vy: ball.vy * 0.82 },
    ]);
    additions.forEach((ball) => normalizeBall(ball));
    engine.balls.push(...additions.slice(0, Math.max(0, 5 - engine.balls.length)));
    return;
  }
  if (type === 'shield') {
    engine.shieldUntil = now + 12_000;
    return;
  }
  if (!engine.slowed) {
    engine.balls.forEach((ball) => {
      ball.vx *= 0.72;
      ball.vy *= 0.72;
    });
    engine.slowed = true;
  }
  engine.slowUntil = now + 9_000;
}

function expirePowerUps(engine: Engine, now: number) {
  if (engine.paddle.width !== PADDLE_WIDTH && engine.wideUntil <= now) {
    const center = engine.paddle.x + engine.paddle.width / 2;
    engine.paddle.width = PADDLE_WIDTH;
    engine.paddle.x = clamp(center - PADDLE_WIDTH / 2, 24, WORLD_WIDTH - 24 - PADDLE_WIDTH);
  }
  if (engine.slowed && engine.slowUntil <= now) {
    engine.balls.forEach((ball) => {
      ball.vx /= 0.72;
      ball.vy /= 0.72;
      normalizeBall(ball);
    });
    engine.slowed = false;
  }
}

function burst(engine: Engine, x: number, y: number, reducedMotion: boolean) {
  if (reducedMotion) return;
  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 * index) / 5;
    engine.particles.push({
      x,
      y,
      vx: Math.cos(angle) * (38 + index * 8),
      vy: Math.sin(angle) * (38 + index * 8),
      life: 0.38,
    });
  }
}

function bounceFromBrick(ball: Ball, brick: Brick, previousX: number, previousY: number) {
  const fromLeft = previousX + BALL_RADIUS <= brick.x;
  const fromRight = previousX - BALL_RADIUS >= brick.x + brick.width;
  const fromTop = previousY + BALL_RADIUS <= brick.y;
  const fromBottom = previousY - BALL_RADIUS >= brick.y + brick.height;
  if (fromLeft || fromRight) ball.vx *= -1;
  else if (fromTop || fromBottom) ball.vy *= -1;
  else {
    const horizontalOverlap = Math.min(
      Math.abs(ball.x + BALL_RADIUS - brick.x),
      Math.abs(brick.x + brick.width - (ball.x - BALL_RADIUS)),
    );
    const verticalOverlap = Math.min(
      Math.abs(ball.y + BALL_RADIUS - brick.y),
      Math.abs(brick.y + brick.height - (ball.y - BALL_RADIUS)),
    );
    if (horizontalOverlap < verticalOverlap) ball.vx *= -1;
    else ball.vy *= -1;
  }
  normalizeBall(ball, Math.min(MAX_SPEED, Math.hypot(ball.vx, ball.vy) + 1.8));
}

function updateEngine(
  engine: Engine,
  delta: number,
  now: number,
  reducedMotion: boolean,
): GamePhase | null {
  expirePowerUps(engine, now);
  const hitThisFrame = new Set<Brick>();
  const steps = clamp(Math.ceil(delta / 0.009), 2, 4);
  const step = delta / steps;

  for (let microstep = 0; microstep < steps; microstep += 1) {
    for (const ball of engine.balls) {
      const previousX = ball.x;
      const previousY = ball.y;
      ball.x += ball.vx * step;
      ball.y += ball.vy * step;

      if (ball.x - BALL_RADIUS < 24) {
        ball.x = 24 + BALL_RADIUS;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x + BALL_RADIUS > WORLD_WIDTH - 24) {
        ball.x = WORLD_WIDTH - 24 - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - BALL_RADIUS < 24) {
        ball.y = 24 + BALL_RADIUS;
        ball.vy = Math.abs(ball.vy);
      }

      if (ball.vy > 0 && circleHitsRect(ball, BALL_RADIUS, engine.paddle)) {
        ball.y = PADDLE_Y - BALL_RADIUS;
        const contact = clamp(
          (ball.x - (engine.paddle.x + engine.paddle.width / 2)) / (engine.paddle.width / 2),
          -1,
          1,
        );
        const speed = clamp(Math.hypot(ball.vx, ball.vy), BASE_SPEED * 0.7, MAX_SPEED);
        ball.vx = speed * contact * 0.84;
        ball.vy = -Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, speed * speed * 0.4));
        normalizeBall(ball, speed);
      }

      if (engine.shieldUntil > now && ball.y + BALL_RADIUS >= WORLD_HEIGHT - 29) {
        ball.y = WORLD_HEIGHT - 29 - BALL_RADIUS;
        ball.vy = -Math.abs(ball.vy);
        normalizeBall(ball);
      }

      for (const brick of engine.bricks) {
        if (!brick.alive || hitThisFrame.has(brick)) continue;
        if (!circleHitsRect(ball, BALL_RADIUS, brick)) continue;
        brick.alive = false;
        hitThisFrame.add(brick);
        engine.destroyed += 1;
        engine.score += 100;
        bounceFromBrick(ball, brick, previousX, previousY);
        burst(engine, brick.x + brick.width / 2, brick.y + brick.height / 2, reducedMotion);
        if (engine.destroyed >= engine.nextDropAt) {
          engine.falling.push({
            x: brick.x + brick.width / 2,
            y: brick.y + brick.height,
            type: POWER_UP_ORDER[engine.dropIndex % POWER_UP_ORDER.length] ?? 'wide',
          });
          engine.dropIndex += 1;
          engine.nextDropAt += 4;
        }
        break;
      }
    }

    for (const powerUp of engine.falling) powerUp.y += 118 * step;
    const collected = engine.falling.filter(
      (powerUp) =>
        powerUp.y >= PADDLE_Y - 8 &&
        powerUp.y <= PADDLE_Y + PADDLE_HEIGHT + 8 &&
        powerUp.x >= engine.paddle.x - 12 &&
        powerUp.x <= engine.paddle.x + engine.paddle.width + 12,
    );
    collected.forEach((powerUp) => applyPowerUp(engine, powerUp.type, now));
    engine.falling = engine.falling.filter(
      (powerUp) => !collected.includes(powerUp) && powerUp.y < WORLD_HEIGHT + 20,
    );
  }

  engine.particles.forEach((particle) => {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;
  });
  engine.particles = engine.particles.filter((particle) => particle.life > 0);
  engine.balls = engine.balls.filter((ball) => ball.y - BALL_RADIUS <= WORLD_HEIGHT + 12);

  if (engine.destroyed === TOTAL_BRICKS) {
    engine.served = false;
    return 'won';
  }
  if (engine.balls.length === 0) {
    engine.lives -= 1;
    if (engine.lives <= 0) {
      engine.served = false;
      return 'lost';
    }
    engine.served = false;
    engine.balls = [dockedBall(engine.paddle)];
  }
  return null;
}

function cssColor(element: HTMLElement, name: string, fallback: string) {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

function readPalette(element: HTMLElement): Palette {
  return {
    card: cssColor(element, '--surface-card', '#ffffff'),
    text: cssColor(element, '--text-primary', '#121314'),
    accent: cssColor(element, '--accent-text', '#037a8f'),
    border: cssColor(element, '--border-subtle', '#dde1e5'),
  };
}

function powerUpGlyph(type: PowerUpType) {
  if (type === 'wide') return '↔';
  if (type === 'multi') return '×3';
  if (type === 'shield') return '◇';
  return '½';
}

export default function Arcade404() {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine>(makeEngine());
  const phaseRef = useRef<GamePhase>('idle');
  const paletteRef = useRef<Palette | null>(null);
  const reducedMotionRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const lastHudUpdateRef = useRef(0);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [hud, setHud] = useState<Hud>(() => makeHud(engineRef.current));
  const [canvasSupported, setCanvasSupported] = useState<boolean | null>(null);

  const setGamePhase = useCallback((next: GamePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const syncHud = useCallback((force = false) => {
    const now = performance.now();
    if (!force && now - lastHudUpdateRef.current < 100) return;
    lastHudUpdateRef.current = now;
    setHud(makeHud(engineRef.current, now));
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const palette = paletteRef.current;
    if (!canvas || !palette) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const engine = engineRef.current;
    const scaleX = canvas.width / WORLD_WIDTH;
    const scaleY = canvas.height / WORLD_HEIGHT;
    context.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    engine.bricks.forEach((brick) => {
      if (!brick.alive) return;
      context.fillStyle = brick.digit === 1 ? palette.accent : palette.text;
      context.globalAlpha = brick.digit === 1 ? 0.94 : 0.85;
      context.beginPath();
      context.roundRect(brick.x, brick.y, brick.width, brick.height, 2);
      context.fill();
    });
    context.globalAlpha = 1;

    const now = phaseRef.current === 'paused' ? (pausedAtRef.current ?? 0) : performance.now();
    if (engine.shieldUntil > now) {
      context.strokeStyle = palette.accent;
      context.lineWidth = 3;
      context.globalAlpha = 0.7;
      context.beginPath();
      context.moveTo(36, WORLD_HEIGHT - 29);
      context.lineTo(WORLD_WIDTH - 36, WORLD_HEIGHT - 29);
      context.stroke();
      context.globalAlpha = 1;
    }

    context.fillStyle = palette.accent;
    context.fillRect(engine.paddle.x, PADDLE_Y, engine.paddle.width, PADDLE_HEIGHT);

    context.fillStyle = palette.accent;
    engine.balls.forEach((ball) => {
      context.beginPath();
      context.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = palette.card;
      context.globalAlpha = 0.65;
      context.lineWidth = 2;
      context.stroke();
      context.globalAlpha = 1;
    });

    engine.falling.forEach((powerUp) => {
      context.fillStyle = palette.accent;
      context.fillRect(powerUp.x - 18, powerUp.y - 10, 36, 20);
      context.fillStyle = palette.card;
      context.font = "600 11px 'IBM Plex Mono', monospace";
      context.textAlign = 'center';
      context.fillText(powerUpGlyph(powerUp.type), powerUp.x, powerUp.y + 1);
      context.textAlign = 'left';
    });

    if (!reducedMotionRef.current) {
      context.fillStyle = palette.accent;
      engine.particles.forEach((particle) => {
        context.globalAlpha = clamp(particle.life / 0.38, 0, 1);
        context.fillRect(particle.x - 2, particle.y - 2, 4, 4);
      });
      context.globalAlpha = 1;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) {
      setCanvasSupported(false);
      return;
    }
    setCanvasSupported(true);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
      paletteRef.current = readPalette(canvas);
      drawFrame();
    };
    const observer = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(() => {
      paletteRef.current = readPalette(canvas);
      drawFrame();
    });
    observer.observe(canvas);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    resize();
    return () => {
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, [drawFrame]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotionRef.current = query.matches;
      if (query.matches) engineRef.current.particles = [];
      drawFrame();
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [drawFrame]);

  useEffect(() => {
    if (phase !== 'running' || canvasSupported === false) {
      drawFrame();
      return;
    }
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      if (phaseRef.current !== 'running') return;
      const delta = Math.min((now - previous) / 1000, 0.032);
      previous = now;
      const result = engineRef.current.served
        ? updateEngine(engineRef.current, delta, now, reducedMotionRef.current)
        : null;
      if (result) setGamePhase(result);
      syncHud(Boolean(result));
      drawFrame();
      if (!result && phaseRef.current === 'running') frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [canvasSupported, drawFrame, phase, setGamePhase, syncHud]);

  const pauseGame = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    pausedAtRef.current = performance.now();
    setGamePhase('paused');
    syncHud(true);
  }, [setGamePhase, syncHud]);

  const resumeGame = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    const pausedAt = pausedAtRef.current;
    if (pausedAt !== null) {
      const pauseDuration = performance.now() - pausedAt;
      const engine = engineRef.current;
      if (engine.wideUntil > pausedAt) engine.wideUntil += pauseDuration;
      if (engine.shieldUntil > pausedAt) engine.shieldUntil += pauseDuration;
      if (engine.slowUntil > pausedAt) engine.slowUntil += pauseDuration;
    }
    pausedAtRef.current = null;
    setGamePhase('running');
    syncHud(true);
  }, [setGamePhase, syncHud]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pauseWhenHidden = () => {
      if (document.hidden) pauseGame();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && !entry.isIntersecting) pauseGame();
      },
      { threshold: 0.05 },
    );
    observer.observe(root);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, [pauseGame]);

  const launchServe = useCallback(() => {
    const engine = engineRef.current;
    if (engine.served) return;
    engine.balls = [dockedBall(engine.paddle)];
    engine.served = true;
    syncHud(true);
    drawFrame();
  }, [drawFrame, syncHud]);

  const startNewGame = useCallback(() => {
    engineRef.current = makeEngine();
    engineRef.current.served = true;
    pausedAtRef.current = null;
    setGamePhase('running');
    syncHud(true);
    canvasRef.current?.focus({ preventScroll: true });
    drawFrame();
  }, [drawFrame, setGamePhase, syncHud]);

  const movePaddle = useCallback(
    (nextX: number) => {
      const engine = engineRef.current;
      engine.paddle.x = clamp(nextX, 24, WORLD_WIDTH - 24 - engine.paddle.width);
      if (!engine.served && engine.balls[0]) {
        engine.balls[0].x = engine.paddle.x + engine.paddle.width / 2;
        engine.balls[0].y = PADDLE_Y - BALL_RADIUS - 3;
      }
      syncHud(phaseRef.current !== 'running');
      drawFrame();
    },
    [drawFrame, syncHud],
  );

  const moveFromPointer = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const logicalX = ((clientX - bounds.left) / bounds.width) * WORLD_WIDTH;
      movePaddle(logicalX - engineRef.current.paddle.width / 2);
    },
    [movePaddle],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    activePointerRef.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events used by browser tests do not enter the active pointer registry.
    }
    moveFromPointer(event.clientX);
    if (phaseRef.current === 'idle' || phaseRef.current === 'won' || phaseRef.current === 'lost')
      startNewGame();
    else if (phaseRef.current === 'paused') resumeGame();
    else if (phaseRef.current === 'running' && !engineRef.current.served) launchServe();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && activePointerRef.current === null) {
      // Hover can preview paddle placement, but only explicit activation starts play.
      moveFromPointer(event.clientX);
      return;
    }
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    moveFromPointer(event.clientX);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') {
      event.preventDefault();
      movePaddle(engineRef.current.paddle.x - 42);
      return;
    }
    if (key === 'arrowright' || key === 'd') {
      event.preventDefault();
      movePaddle(engineRef.current.paddle.x + 42);
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      if (phaseRef.current === 'idle' || phaseRef.current === 'lost' || phaseRef.current === 'won')
        startNewGame();
      else if (phaseRef.current === 'paused') resumeGame();
      else if (!engineRef.current.served) launchServe();
      else pauseGame();
      return;
    }
    if (key === 'p' || key === 'escape') {
      event.preventDefault();
      if (phaseRef.current === 'running') pauseGame();
      else if (phaseRef.current === 'paused') resumeGame();
    }
  };

  const statusLabel =
    phase === 'idle'
      ? t('Awaiting start')
      : phase === 'paused'
        ? t('Paused')
        : phase === 'won'
          ? t('404 cleared')
          : phase === 'lost'
            ? t('Game over')
            : hud.served
              ? t('In play')
              : t('Ball ready — press Space');

  return (
    <div
      ref={rootRef}
      className="arcade404-game"
      data-game-state={phase}
      data-pattern="404"
      data-score={hud.score}
      data-lives={hud.lives}
      data-bricks={hud.remaining}
      data-total-bricks={TOTAL_BRICKS}
      data-paddle-x={hud.paddleX}
      data-falling-powerups={hud.falling}
      data-active-powerups={hud.active.map(({ type }) => type).join(',')}
      data-canvas-supported={canvasSupported === false ? 'false' : 'true'}
    >
      <div className="arcade404-board-frame">
        <canvas
          ref={canvasRef}
          className="arcade404-board"
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          tabIndex={0}
          role="application"
          aria-label={t(
            'Arkanoid game board. Break the bricks that form 404. Use Arrow keys or A and D to move, Space to launch or pause, and P or Escape to pause.',
          )}
          aria-describedby="arcade404-live-status"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClick={() => {
            if (
              phaseRef.current === 'idle' ||
              phaseRef.current === 'won' ||
              phaseRef.current === 'lost'
            )
              startNewGame();
            else if (phaseRef.current === 'paused') resumeGame();
          }}
          hidden={canvasSupported === false}
        />
        {canvasSupported === false && (
          <div
            className="arcade404-fallback"
            role="status"
            aria-label={t('The game board is unavailable.')}
          >
            404
          </div>
        )}
      </div>

      <p id="arcade404-live-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {t('{state}. Score {score}. {bricks} bricks remain. {lives} lives.', {
          state: statusLabel,
          score: hud.score,
          bricks: hud.remaining,
          lives: hud.lives,
        })}
      </p>
    </div>
  );
}
