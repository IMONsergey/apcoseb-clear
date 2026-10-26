import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import type { Browser } from '@playwright/test';

interface PerformanceSampleState {
  lcp: number;
  longTasks: number[];
  events: number[];
  firstResponse: number;
  shifts: { time: number; value: number }[];
}

declare global {
  interface Window {
    __performanceSample: PerformanceSampleState;
  }
}

interface PerformanceProfile {
  name: string;
  width: number;
  cpu: number;
  latency: number;
  download: number;
}

interface PerformanceSample {
  profile: string;
  route: string;
  run: number;
  lcpMs: number;
  fcpMs: number;
  cls: number;
  requestCount: number;
  scriptBytes: number;
  styleBytes: number;
  fontBytes: number;
  imageBytes: number;
  longTaskCount: number;
  blockingMs: number;
  longestTaskMs: number;
  resourceBytes: number;
  clickToFrameMs: number;
  observedEventMs: number;
}

type MetricKey =
  | 'lcpMs'
  | 'blockingMs'
  | 'longestTaskMs'
  | 'clickToFrameMs'
  | 'observedEventMs'
  | 'resourceBytes'
  | 'fcpMs'
  | 'cls'
  | 'requestCount'
  | 'scriptBytes'
  | 'styleBytes'
  | 'fontBytes'
  | 'imageBytes';

const metricKeys: readonly MetricKey[] = [
  'lcpMs',
  'fcpMs',
  'cls',
  'requestCount',
  'scriptBytes',
  'styleBytes',
  'fontBytes',
  'imageBytes',
  'blockingMs',
  'longestTaskMs',
  'clickToFrameMs',
  'observedEventMs',
  'resourceBytes',
];

const args = process.argv.slice(2);
const options = new Set<string>(['--output', '--dist', '--runs', '--routes', '--screenshots']);
for (let i = 0; i < args.length; i += 2) {
  const name = args[i];
  const value = args[i + 1];
  if (!name || !options.has(name) || !value || value.startsWith('--')) {
    throw new Error(
      'Use --output <file>, --dist <directory>, --runs <1–10>, --routes </path/,/path/>, or --screenshots <directory>.',
    );
  }
}
const option = (name: string, fallback: string): string => {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  const value = args[index + 1];
  if (!value) throw new Error(`Missing value for ${name}.`);
  return value;
};
const output = option('--output', '.work/performance.json');
const dist = option('--dist', 'dist');
const routes = [...new Set(option('--routes', '/,/about/,/legal/privacy-policy/').split(','))];
if (!routes.length || routes.some((route) => !/^\/(?:[a-z0-9-]+\/)*$/.test(route)))
  throw new Error('Measurement routes must be absolute directory paths.');
const screenshots = option('--screenshots', '');
if (screenshots) await mkdir(resolve(screenshots), { recursive: true });
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
let browser: Browser | undefined;
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
  const activeBrowser = await chromium.launch({
    ...(process.env.APCO_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.APCO_CHROMIUM_EXECUTABLE }
      : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  browser = activeBrowser;
  const samples: PerformanceSample[] = [];
  const profiles: readonly PerformanceProfile[] = [
    { name: 'desktop', width: 1440, cpu: 1, latency: 0, download: -1 },
    { name: 'mobile-constrained', width: 390, cpu: 4, latency: 80, download: 200000 },
  ];
  for (const profile of profiles)
    for (const route of routes) {
      for (let run = 1; run <= runs; run++) {
        const context = await activeBrowser.newContext({
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
          const report: PerformanceSampleState = {
            lcp: 0,
            longTasks: [],
            events: [],
            firstResponse: 0,
            shifts: [],
          };
          window.__performanceSample = report;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) report.lcp = entry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
              if (!shift.hadRecentInput)
                report.shifts.push({ time: shift.startTime, value: shift.value });
            }
          }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) report.longTasks.push(entry.duration);
          }).observe({ type: 'longtask', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (
                'interactionId' in entry &&
                typeof entry.interactionId === 'number' &&
                entry.interactionId
              ) {
                report.events.push(entry.duration);
              }
            }
          }).observe({
            type: 'event',
            durationThreshold: 16,
            buffered: true,
          } as PerformanceObserverInit & { durationThreshold: number });
          document.addEventListener(
            'click',
            (event) => {
              if (
                !(event.target instanceof Element) ||
                !event.target.closest('.theme-trigger, .menu-toggle')
              )
                return;
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
        await page.goto(base + route.slice(1), { waitUntil: 'load' });
        await page.locator('main h1').waitFor({ state: 'visible' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1200);
        const load = await page.evaluate(() => {
          const r = window.__performanceSample;
          const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
          let scriptBytes = 0,
            styleBytes = 0,
            fontBytes = 0,
            imageBytes = 0;
          for (const entry of resources) {
            const path = new URL(entry.name).pathname;
            if (/\.js$/.test(path)) scriptBytes += entry.transferSize;
            else if (/\.css$/.test(path)) styleBytes += entry.transferSize;
            else if (/\.woff2$/.test(path)) fontBytes += entry.transferSize;
            else if (/\.(?:webp|svg|png)$/.test(path)) imageBytes += entry.transferSize;
          }
          let start = 0,
            last = 0,
            sum = 0,
            cls = 0;
          for (const shift of r.shifts) {
            if (shift.time - last > 1000 || shift.time - start > 5000) {
              start = shift.time;
              sum = 0;
            }
            sum += shift.value;
            last = shift.time;
            cls = Math.max(cls, sum);
          }
          return {
            fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
            cls,
            requestCount: resources.length,
            scriptBytes,
            styleBytes,
            fontBytes,
            imageBytes,
            lcpMs: r.lcp,
            longTaskCount: r.longTasks.length,
            blockingMs: r.longTasks.reduce((sum, duration) => sum + Math.max(0, duration - 50), 0),
            longestTaskMs: Math.max(0, ...r.longTasks),
            resourceBytes: performance
              .getEntriesByType('resource')
              .reduce(
                (sum, entry) =>
                  sum + (entry instanceof PerformanceResourceTiming ? entry.transferSize : 0),
                0,
              ),
          };
        });
        if (screenshots && run === 1)
          await page.screenshot({
            path: resolve(
              screenshots,
              `${profile.name}-${route.replace(/\//g, '-').replace(/^-|-$/g, '') || 'home'}.png`,
            ),
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
  const median = (values: readonly number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const value = sorted[middle];
    if (value === undefined) throw new Error('Cannot calculate a median without samples.');
    return sorted.length % 2 ? value : (sorted[middle - 1]! + value) / 2;
  };
  const summary = profiles.flatMap(({ name }) =>
    routes.map((route) => {
      const rows = samples.filter(
        (sample) => sample.profile === name && sample.route === (route || '/'),
      );
      return {
        profile: name,
        route: route || '/',
        ...Object.fromEntries(
          metricKeys.map((key) => [
            key,
            key === 'cls'
              ? Number(median(rows.map((row) => row[key])).toFixed(4))
              : Math.round(median(rows.map((row) => row[key]))),
          ]),
        ),
      };
    }),
  );
  const report = {
    collectedAt: new Date().toISOString(),
    browser: activeBrowser.version(),
    runs,
    routes,
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
