import { expect, test, type Locator } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

function expectContinuous(samples: { height: number; time: number }[], minimumDelta = 40) {
  const delta = Math.abs(samples.at(-1)!.height - samples[0]!.height);
  expect(delta).toBeGreaterThan(minimumDelta);
  // Measure progress rather than whole pixels: a small content change still needs smooth motion.
  const start = samples[0]!.height;
  const progress = samples.map((sample) => Math.round(((sample.height - start) / delta) * 100));
  expect(new Set(progress).size).toBeGreaterThan(8);
  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1]!,
      current = samples[i]!;
    // Bound velocity, not frame count: software-rendered CI can skip animation frames.
    const elapsed = current.time - previous.time;
    expect(Math.abs(current.height - previous.height) / delta).toBeLessThan(
      (4.5 * elapsed) / 480 + 0.05,
    );
  }
}

async function sampleDemoMotion(scene: Locator, duration = 2100) {
  return scene.evaluate(async (root, observationTime) => {
    const cursor = root.querySelector<HTMLElement>('.application-demo-cursor');
    if (!cursor) throw new Error('The animated demonstration must contain a visible cursor.');
    const read = () => {
      const style = getComputedStyle(cursor);
      const matrix = new DOMMatrixReadOnly(
        style.transform === 'none' ? undefined : style.transform,
      );
      const phase = root.getAttribute('data-demo-phase');
      return {
        phase: phase === null ? null : Number(phase),
        transform: style.transform,
        x: matrix.m41,
        y: matrix.m42,
        visible:
          style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0,
      };
    };
    const started = performance.now();
    const samples = [read()];
    while (performance.now() - started < observationTime) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      samples.push(read());
    }
    return samples;
  }, duration);
}

async function expectDemoMoving(scene: Locator) {
  await expect(scene).toHaveAttribute('data-demo-playback', 'playing');
  // The longest phase includes a reading pause and lasts 2.6 seconds.
  const samples = await sampleDemoMotion(scene, 3100);
  expect(
    samples.every(
      ({ phase }) => phase !== null && Number.isInteger(phase) && phase >= 0 && phase <= 3,
    ),
  ).toBe(true);
  const visible = samples.filter((sample) => sample.visible);
  expect(visible.length, 'normal-motion playback must show its cursor').toBeGreaterThan(2);
  expect(new Set(visible.map(({ transform }) => transform)).size).toBeGreaterThan(2);
  const travel = Math.hypot(
    Math.max(...visible.map(({ x }) => x)) - Math.min(...visible.map(({ x }) => x)),
    Math.max(...visible.map(({ y }) => y)) - Math.min(...visible.map(({ y }) => y)),
  );
  expect(
    travel,
    'the rendered cursor must travel, not only advertise playing state',
  ).toBeGreaterThan(8);
  expect(
    new Set(samples.map(({ phase }) => phase)).size,
    'the visible demonstration advances',
  ).toBeGreaterThan(1);
}

async function expectDemoResting(scene: Locator, playback: 'paused' | 'static') {
  await expect(scene).toHaveAttribute('data-demo-playback', playback);
  const samples = await sampleDemoMotion(scene);
  expect(new Set(samples.map(({ phase, transform }) => `${phase}:${transform}`)).size).toBe(1);
}

test('application API demonstration moves while visible and sleeps outside the viewport', async ({
  page,
}) => {
  await page.goto('./');
  await page.locator('#api').scrollIntoViewIfNeeded();
  const api = page.locator('.application-scene[data-scene="api"]');
  await api.scrollIntoViewIfNeeded();
  await expect(api).toBeVisible();
  await expectDemoMoving(api);
  await page.locator('.hero h1').scrollIntoViewIfNeeded();
  await expectDemoResting(api, 'paused');
});

test('all five application investigation demonstrations move only while visible', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('./');
  for (const [index, name] of ['query', 'results', 'host', 'evidence', 'suggestions'].entries()) {
    const card = page.locator('.step-card').nth(index);
    await card.scrollIntoViewIfNeeded();
    const scene = card.locator(`.application-scene[data-scene="${name}"]`);
    await scene.scrollIntoViewIfNeeded();
    await expectDemoMoving(scene);
    await page.locator('.hero h1').scrollIntoViewIfNeeded();
    await expectDemoResting(scene, 'paused');
  }
});

test('application playback pauses on a document visibility notification and resumes when visible', async ({
  page,
}) => {
  await page.goto('./');
  const scene = page.locator('.application-scene[data-scene="api"]');
  await page.locator('#api').scrollIntoViewIfNeeded();
  await scene.scrollIntoViewIfNeeded();
  await expectDemoMoving(scene);
  // Emulate the browser visibility signal, without exposing animation internals.
  const hidden = await scene.evaluate(async (root) => {
    const descriptors = ['hidden', 'visibilityState'].map((key) => ({
      key,
      descriptor: Object.getOwnPropertyDescriptor(document, key),
    }));
    const read = () => ({
      phase: root.getAttribute('data-demo-phase'),
      transform: getComputedStyle(root.querySelector('.application-demo-cursor')!).transform,
    });
    try {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      const started = performance.now();
      while (
        root.getAttribute('data-demo-playback') !== 'paused' &&
        performance.now() - started < 5000
      )
        await new Promise((resolve) => setTimeout(resolve, 50));
      const before = read();
      await new Promise((resolve) => setTimeout(resolve, 2100));
      return { before, after: read(), playback: root.getAttribute('data-demo-playback') };
    } finally {
      for (const { key, descriptor } of descriptors) {
        if (descriptor) Object.defineProperty(document, key, descriptor);
        else Reflect.deleteProperty(document, key);
      }
      document.dispatchEvent(new Event('visibilitychange'));
    }
  });
  expect(hidden.playback).toBe('paused');
  expect(hidden.after).toEqual(hidden.before);
  await expectDemoMoving(scene);
});

for (const width of [390, 1440]) {
  test(
    'API keeps its viewport stable through rapid request and response switches at ' + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('./developers/api');
      await page.locator('.stage-code-window').scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const samples = await page.locator('.stage-code-window').evaluate(async (root) => {
        const buttons = root.querySelectorAll<HTMLButtonElement>('.stage-code-tabs button');
        const heights = [root.getBoundingClientRect().height];
        buttons[1]!.click();
        for (let i = 0; i < 42; i++) {
          await new Promise(requestAnimationFrame);
          heights.push(root.getBoundingClientRect().height);
        }
        return heights;
      });
      expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(1);
      const buttons = page.locator('.stage-code-tabs button');
      await buttons.first().click();
      await buttons.last().click();
      await buttons.first().click();
      await expect(page.locator('.stage-code-window pre')).toContainText(
        'https://api.apcosys.net/api/v1/search/hosts',
      );
      expect((await page.locator('.stage-code-window').boundingBox())!.height).toBeCloseTo(
        samples[0]!,
        0,
      );
    },
  );
}

test('Home service selection keeps the response banner connected to its host', async ({ page }) => {
  await page.goto('./');
  const sample = page.locator('.search-scene__results .product-evidence');
  await sample.getByRole('button', { name: /80.*HTTP/ }).click();
  await expect(sample.locator('.evidence-response')).toContainText('301 Moved Permanently');
  await expect(sample.locator('.evidence-response')).toContainText('portal.example.com');
  await sample.locator('.product-evidence__result').nth(1).click();
  await sample.getByRole('button', { name: /22.*SSH/ }).click();
  await expect(sample.locator('.evidence-response')).toContainText('SSH-2.0-OpenSSH_9.6');
  await sample.getByRole('button', { name: /443.*HTTPS/ }).click();
  await expect(sample.locator('.evidence-response')).toContainText('Server: nginx/1.24.0');
});

test('monitoring switches resize through intermediate frames on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, panel, button] of [
    [
      './platform/monitoring',
      '.stage-monitor-console__body > .morph-panel',
      '.stage-monitor-console__nav:nth-of-type(4)',
    ],
  ]) {
    await page.goto(route!);
    await page.locator(panel!).scrollIntoViewIfNeeded();
    const sizes = await page.evaluate(
      async ({ panel, button }) => {
        const node = document.querySelector(panel!)!;
        const values = [{ height: node.getBoundingClientRect().height, time: performance.now() }];
        document.querySelector<HTMLButtonElement>(button!)!.click();
        for (let i = 0; i < 42; i++) {
          await new Promise(requestAnimationFrame);
          values.push({ height: node.getBoundingClientRect().height, time: performance.now() });
        }
        return values;
      },
      { panel, button },
    );
    // Unified type can leave only a few pixels between states; interpolation remains mandatory.
    expectContinuous(sizes, 1);
  }
});

test('reduced motion keeps all application scenes and product evidence readable without playback', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  for (const [index, name] of ['query', 'results', 'host', 'evidence', 'suggestions'].entries()) {
    const card = page.locator('.step-card').nth(index);
    await card.scrollIntoViewIfNeeded();
    const scene = card.locator(`.application-scene[data-scene="${name}"]`);
    await expect(scene).toBeVisible();
    await expect(scene).toHaveAttribute('data-demo-playback', 'static');
    await expect(scene).toHaveAttribute('data-demo-phase', '0');
    await expect(scene.locator('.application-demo-cursor')).toBeHidden();
  }
  await page.locator('#api').scrollIntoViewIfNeeded();
  const api = page.locator('.application-scene[data-scene="api"]');
  await api.scrollIntoViewIfNeeded();
  await expect(api).toBeVisible();
  await expect(api.locator('.application-api__heading')).toHaveText('API access');
  await expect(api.locator('.application-demo-cursor')).toBeHidden();
  await expectDemoResting(api, 'static');
  const evidence = page.locator('.search-scene__results .product-evidence');
  await evidence.scrollIntoViewIfNeeded();
  await expect(evidence.locator('.evidence-response')).toContainText('HTTP/1.1 200 OK');
  await expect(evidence.locator('.evidence-cursor')).toBeHidden();
});

test('team signal field animates only while visible and respects reduced motion', async ({
  page,
}) => {
  await page.goto('./');
  const field = page.locator('.team-signal-field');
  await field.scrollIntoViewIfNeeded();
  const frame = () => field.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const first = await frame();
  await expect.poll(frame).not.toBe(first);
  await page.locator('.hero').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const outside = await frame();
  await page.waitForTimeout(250);
  expect(await frame()).toBe(outside);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await field.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const still = await frame();
  await page.waitForTimeout(250);
  expect(await frame()).toBe(still);
});

test('signal-trace canvas does not reset its backing store on every fractional-size frame', async ({
  page,
}) => {
  await page.goto('./platform/monitoring');
  const canvas = page.locator('.page-artwork__trace');
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toBeVisible();

  const writes = await canvas.evaluate(async (node: HTMLCanvasElement) => {
    node.style.width = '375.5px';
    node.style.height = '112.25px';
    await new Promise(requestAnimationFrame);

    const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width')!;
    let count = 0;
    Object.defineProperty(node, 'width', {
      configurable: true,
      get() {
        return descriptor.get!.call(node) as number;
      },
      set(value: number) {
        count++;
        descriptor.set!.call(node, value);
      },
    });

    for (let i = 0; i < 24; i++) await new Promise(requestAnimationFrame);
    return count;
  });

  expect(writes).toBeLessThanOrEqual(2);
});
