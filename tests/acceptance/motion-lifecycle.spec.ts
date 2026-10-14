import { expect, test } from '@playwright/test';

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

test('original API really plays, then sleeps outside the viewport', async ({ page }) => {
  await page.goto('./');
  await page.locator('#api').scrollIntoViewIfNeeded();
  const api = page.locator('api-developer-demo');
  await expect(api).toBeVisible();
  const time = () => api.evaluate((el) => Reflect.get(el, '_timeline')?.time() as number);
  await expect.poll(time).toBeGreaterThan(0.3);
  const before = await time();
  await page.waitForTimeout(250);
  expect(await time()).toBeGreaterThan(before);
  await page.locator('.hero h1').scrollIntoViewIfNeeded();
  await expect.poll(() => api.evaluate((el) => Reflect.get(el, '_timeline')?.paused())).toBe(true);
  const resting = await time();
  await page.waitForTimeout(250);
  expect(await time()).toBe(resting);
});

test('all five original investigation films mount and animate', async ({ page }) => {
  await page.goto('./');
  for (const [index, name] of ['query', 'results', 'host', 'evidence', 'suggestions'].entries()) {
    const card = page.locator('.step-card').nth(index);
    await card.scrollIntoViewIfNeeded();
    const scene = card.locator('apcosys-product-demo');
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('scene', name);
    await expect
      .poll(() => scene.evaluate((el) => Reflect.get(el, '_timeline')?.time()))
      .toBeGreaterThan(0.1);
  }
});

for (const width of [390, 1440]) {
  test(
    'API expands continuously, handles interruption and settles at ' + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('./developers/api');
      await page.locator('.stage-code-window').scrollIntoViewIfNeeded();
      const samples = await page.locator('.stage-code-window').evaluate(async (root) => {
        const box = root.querySelector<HTMLElement>('.morph-panel')!;
        const buttons = root.querySelectorAll<HTMLButtonElement>('.stage-code-tabs button');
        const heights = [{ height: box.getBoundingClientRect().height, time: performance.now() }];
        buttons[1]!.click();
        for (let i = 0; i < 42; i++) {
          await new Promise(requestAnimationFrame);
          heights.push({ height: box.getBoundingClientRect().height, time: performance.now() });
        }
        return heights;
      });
      expectContinuous(samples);
      const buttons = page.locator('.stage-code-tabs button');
      await buttons.first().click();
      await buttons.last().click();
      await buttons.first().click();
      await expect
        .poll(() =>
          page
            .locator('.stage-code-window .morph-panel')
            .evaluate((el) => el.getAttribute('data-morphing')),
        )
        .toBe('false');
      await expect(page.locator('.stage-code-window pre')).toContainText('APCOSYS_API_ENDPOINT');
    },
  );
}

test('service selection produces the matching banner and animation can be paused', async ({
  page,
}) => {
  await page.goto('./platform/search-investigation');
  const sample = page.locator('.stage-workbench__record');
  await sample.getByRole('button', { name: /80.*HTTP/ }).click();
  await expect(sample.locator('.evidence-response')).toContainText('301 Moved Permanently');
  await sample.locator('.product-evidence__result').nth(1).click();
  await sample.getByRole('button', { name: /22.*SSH/ }).click();
  await expect(sample.locator('.evidence-response')).toContainText('SSH-2.0-OpenSSH_9.6');
  await sample.getByRole('button', { name: 'Pause product animation' }).click();
  await expect(sample.getByRole('button', { name: 'Play product animation' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('capability and monitoring switches resize through intermediate frames on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, panel, button] of [
    [
      './',
      '.home-capabilities > .container > .morph-panel',
      '.home-capabilities__tabs button:nth-child(4)',
    ],
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

test('reduced motion keeps API and evidence readable without playback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.locator('#api').scrollIntoViewIfNeeded();
  await expect(page.locator('api-developer-demo')).toBeVisible();
  expect(
    await page.locator('api-developer-demo').evaluate((el) => Reflect.get(el, '_timeline')),
  ).toBeNull();
  await page.goto('./platform/search-investigation');
  await expect(page.locator('.evidence-response')).toContainText('HTTP/1.1 200 OK');
  await expect(page.locator('.evidence-cursor')).toBeHidden();
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
