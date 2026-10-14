/* global window, document, requestAnimationFrame */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const options = new Set(['--output', '--dist', '--runs']);
for (let i = 0; i < args.length; i += 2) {
  if (!options.has(args[i]) || !args[i + 1] || args[i + 1].startsWith('--'))
    throw new Error('Use --output <file>, --dist <directory>, or --runs <1–10>.');
}
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const output = option('--output', '.work/performance.json');
const dist = option('--dist', 'dist');
const runs = Number(option('--runs', '3'));
if (!Number.isInteger(runs) || runs < 1 || runs > 10) throw new Error('Runs must be 1–10.');
const previewPath = process.env.APCO_TEST_BASE_PATH || '/apcoseb-clear/';
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(previewPath))
  throw new Error('APCO_TEST_BASE_PATH must be a directory path such as /site/ or /.');
const base = process.env.APCO_BASE_URL || `http://127.0.0.1:4196${previewPath}`;
const server = process.env.APCO_BASE_URL
  ? undefined
  : spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '4196',
        '--strictPort',
        '--outDir',
        dist,
        '--base',
        previewPath,
      ],
      { stdio: 'ignore' },
    );
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server && server.exitCode !== null) throw new Error('Preview exited before measurement.');
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* Server is starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Preview did not become available.');
  browser = await chromium.launch({
    ...(process.env.APCO_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.APCO_CHROMIUM_EXECUTABLE }
      : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const samples = [];
  const profiles = [
    { name: 'desktop', width: 1440, cpu: 1, latency: 0, download: -1 },
    { name: 'mobile-constrained', width: 390, cpu: 4, latency: 80, download: 200000 },
  ];
  for (const profile of profiles)
    for (const route of ['', 'about/', 'legal/privacy-policy/']) {
      for (let run = 1; run <= runs; run++) {
        const context = await browser.newContext({
          viewport: { width: profile.width, height: 900 },
          reducedMotion: 'no-preference',
          serviceWorkers: 'block',
        });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: profile.latency,
          downloadThroughput: profile.download,
          uploadThroughput: profile.download,
        });
        await page.addInitScript(() => {
          const report = { lcp: 0, longTasks: [], events: [], firstResponse: 0 };
          window.__performanceSample = report;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) report.lcp = entry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) report.longTasks.push(entry.duration);
          }).observe({ type: 'longtask', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries())
              if (entry.interactionId) report.events.push(entry.duration);
          }).observe({ type: 'event', durationThreshold: 16, buffered: true });
          document.addEventListener(
            'click',
            (event) => {
              if (!event.target.closest('.theme-trigger, .menu-toggle')) return;
              const start = event.timeStamp;
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  report.firstResponse = performance.now() - start;
                }),
              );
            },
            { once: true },
          );
        });
        await page.goto(base + route, { waitUntil: 'load' });
        await page.locator('main h1').waitFor({ state: 'visible' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1200);
        const load = await page.evaluate(() => {
          const r = window.__performanceSample;
          return {
            lcpMs: r.lcp,
            longTaskCount: r.longTasks.length,
            blockingMs: r.longTasks.reduce((sum, duration) => sum + Math.max(0, duration - 50), 0),
            longestTaskMs: Math.max(0, ...r.longTasks),
            resourceBytes: performance
              .getEntriesByType('resource')
              .reduce((sum, e) => sum + e.transferSize, 0),
          };
        });
        await page.locator(profile.width < 1200 ? '.menu-toggle' : '.theme-trigger').click();
        await page.waitForTimeout(500);
        const response = await page.evaluate(() => ({
          clickToFrameMs: window.__performanceSample.firstResponse,
          observedEventMs: Math.max(0, ...window.__performanceSample.events),
        }));
        samples.push({ profile: profile.name, route: route || '/', run, ...load, ...response });
        await context.close();
      }
      console.log(`${profile.name} ${route || '/'}: ${runs} cold runs complete`);
    }
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const summary = profiles.flatMap(({ name }) =>
    ['', 'about/', 'legal/privacy-policy/'].map((route) => {
      const rows = samples.filter(
        (sample) => sample.profile === name && sample.route === (route || '/'),
      );
      return {
        profile: name,
        route: route || '/',
        ...Object.fromEntries(
          [
            'lcpMs',
            'blockingMs',
            'longestTaskMs',
            'clickToFrameMs',
            'observedEventMs',
            'resourceBytes',
          ].map((key) => [key, Math.round(median(rows.map((row) => row[key])))]),
        ),
      };
    }),
  );
  const report = {
    collectedAt: new Date().toISOString(),
    browser: browser.version(),
    runs,
    profiles,
    scope:
      'Cold-cache Chromium lab measurements with live motion. Medians of controlled samples, not field Core Web Vitals. blockingMs sums long-task excess above 50ms until the load checkpoint; it is not Lighthouse TBT. observedEventMs and clickToFrameMs describe one scripted menu interaction, not page INP. transferSize may be zero for resources without timing access on remote hosts.',
    summary,
    samples,
  };
  await mkdir(dirname(resolve(output)), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser?.close();
  server?.kill();
}
