import { expect, test } from '@playwright/test';

test('missing route shows only a single-screen arcade, a short title and home link', async ({
  page,
}) => {
  await page.goto('./missing-arkanoid-route');
  await expect(page.locator('main')).toHaveAttribute('data-route', '/404');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.getByRole('link', { name: 'Return to home' })).toHaveAttribute('href', /\/$/);
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.site-footer, .arcade404-hud, .arcade404-guide')).toHaveCount(0);
  await expect(page.locator('.arcade404-home.double-button .double-button__icon')).toBeVisible();
  await expect(page.locator('.arcade404-header h1')).toBeVisible();
  await expect(page.locator('.arcade404-home')).toBeVisible();
  const game = page.locator('.arcade404-game');
  const board = page.getByRole('application', { name: /Arkanoid game board/ });
  await expect(game).toHaveAttribute('data-game-state', 'idle');
  await expect(game).toHaveAttribute('data-pattern', '404');
  await expect(game).toHaveAttribute('data-total-bricks', '44');
  await expect(game).toHaveAttribute('data-bricks', '44');
  await expect(board).toBeVisible();
  expect((await board.screenshot()).byteLength).toBeGreaterThan(4_000);
  await expect(board).toHaveCSS('border-top-width', '0px');
  await expect(board).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const metrics = await page.evaluate(() => ({
    doc: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    body: document.body.scrollHeight - innerHeight,
    root: document.documentElement.scrollWidth - innerWidth,
  }));
  expect(metrics.doc).toBeLessThanOrEqual(1);
  expect(metrics.body).toBeLessThanOrEqual(1);
  expect(metrics.root).toBeLessThanOrEqual(1);
});

test('the game has no decorative grid and the paddle uses the accent color', async ({ page }) => {
  await page.goto('./empty-game-canvas');
  const board = page.locator('.arcade404-board');
  await expect(board).toBeVisible();

  await expect
    .poll(async () =>
      board.evaluate((canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d');
        if (!context) return false;
        const sample = (x: number, y: number) =>
          Array.from(
            context.getImageData(
              Math.floor((x * canvas.width) / 960),
              Math.floor((y * canvas.height) / 620),
              1,
              1,
            ).data,
          );
        const blank = [24, 300, 936].map((x) => sample(x, 400));
        const reference = document.createElement('canvas');
        reference.width = 1;
        reference.height = 1;
        const referenceContext = reference.getContext('2d');
        if (!referenceContext) return false;
        referenceContext.fillStyle = getComputedStyle(canvas)
          .getPropertyValue('--accent-text')
          .trim();
        referenceContext.fillRect(0, 0, 1, 1);
        const accent = Array.from(referenceContext.getImageData(0, 0, 1, 1).data);
        const paddle = document.querySelector('.arcade404-game');
        const paddleX = Number(paddle?.getAttribute('data-paddle-x'));
        const paddleSamples = [16, 62, 108].map((offset) => sample(paddleX + offset, 574));
        return (
          blank.every((pixel) => pixel.every((channel) => channel === 0)) &&
          paddleSamples.every((pixel) => pixel.every((channel, i) => channel === accent[i]))
        );
      }),
    )
    .toBe(true);
});

test('returning from a scrolled route keeps the shared header visible on 404', async ({
  page,
  baseURL,
}) => {
  await page.goto('./pricing');
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.evaluate((href) => {
    const link = document.createElement('a');
    link.href = href;
    document.querySelector('main')?.append(link);
    link.click();
    link.remove();
  }, new URL('missing-after-scroll', baseURL).href);
  await expect(page.locator('main')).toHaveAttribute('data-route', '/404');
  await expect(page.locator('.site-header')).toHaveAttribute('data-hidden', 'false');
  await expect(page.locator('.site-header')).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.arcade404-board')).toBeVisible();
});

test('keyboard, pointer and silent restart are usable directly on the game board', async ({
  page,
}) => {
  await page.goto('./arcade-controls');
  const game = page.locator('.arcade404-game');
  const board = page.locator('.arcade404-board');
  await board.focus();
  const initialPaddleX = Number(await game.getAttribute('data-paddle-x'));
  await page.keyboard.press('ArrowLeft');
  await expect
    .poll(async () => Number(await game.getAttribute('data-paddle-x')))
    .toBeLessThan(initialPaddleX);
  const bounds = await board.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.2, bounds!.y + bounds!.height * 0.8);
  const leftX = Number(await game.getAttribute('data-paddle-x'));
  await page.mouse.move(bounds!.x + bounds!.width * 0.8, bounds!.y + bounds!.height * 0.8);
  await expect
    .poll(async () => Number(await game.getAttribute('data-paddle-x')))
    .toBeGreaterThan(leftX);
  await page.mouse.click(bounds!.x + bounds!.width * 0.8, bounds!.y + bounds!.height * 0.8);
  await expect(game).toHaveAttribute('data-game-state', 'running');
  await board.focus();
  await page.keyboard.press('Space');
  await expect(game).toHaveAttribute('data-game-state', 'paused');
  await page.keyboard.press('Space');
  await expect(game).toHaveAttribute('data-game-state', 'running');
  await page.keyboard.press('p');
  await expect(game).toHaveAttribute('data-game-state', 'paused');
  await page.keyboard.press('Escape');
  await expect(game).toHaveAttribute('data-game-state', 'running');
  await expect(page.locator('audio, video')).toHaveCount(0);
});

for (const { width, height } of [
  { width: 320, height: 568 },
  { width: 390, height: 667 },
  { width: 768, height: 640 },
  { width: 1024, height: 600 },
  { width: 1440, height: 900 },
  { width: 1856, height: 950 },
]) {
  test(`404 fills the viewport without vertical or horizontal scroll at ${width}×${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('./not-found-viewport');
    const game = page.locator('.arcade404-board');
    await expect(game).toBeVisible();
    await expect(page.locator('.arcade404-home')).toBeInViewport();
    const bounds = await game.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(-1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height + 1);
    const metrics = await page.evaluate(() => ({
      vertical: document.documentElement.scrollHeight - innerHeight,
      horizontal: document.documentElement.scrollWidth - innerWidth,
    }));
    expect(metrics.vertical).toBeLessThanOrEqual(1);
    expect(metrics.horizontal).toBeLessThanOrEqual(1);
  });
}

test('local 404 title and only the home action are translated', async ({ page }) => {
  await page.goto('./ru/not-found-minimal');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Страница не найдена');
  await expect(page.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', /\/ru\/$/);
  await page.goto('./zh-hant/not-found-minimal');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('找不到頁面');
  await expect(page.getByRole('link', { name: '返回首頁' })).toHaveAttribute(
    'href',
    /\/zh-hant\/$/,
  );
});

test('missing Canvas 2D support leaves an accessible 404 and working exit', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('./canvas-fallback');
  await expect(page.locator('.arcade404-game')).toHaveAttribute('data-canvas-supported', 'false');
  await expect(page.locator('.arcade404-fallback')).toContainText('404');
  await expect(page.getByRole('link', { name: 'Return to home' })).toBeVisible();
});
