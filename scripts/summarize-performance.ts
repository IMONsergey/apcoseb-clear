import { readFileSync, appendFileSync } from 'node:fs';

interface PerformanceReport {
  summary: {
    route: string;
    profile: string;
    fcpMs: number;
    lcpMs: number;
    blockingMs: number;
    resourceBytes: number;
    cls: number;
  }[];
}

const before: PerformanceReport = JSON.parse(readFileSync('.work/performance-before.json', 'utf8'));
const after: PerformanceReport = JSON.parse(readFileSync('.work/performance-after.json', 'utf8'));
const lines = [
  '## Page performance',
  '',
  'Medians of three cold Chromium runs on the same runner. Mobile: 4× CPU throttling, 80 ms latency, 1.6 Mbps. These are lab samples, not field Core Web Vitals.',
  '',
  '| Profile / route | FCP before → after, ms | LCP before → after, ms | Blocking before → after, ms | Transfer before → after, KiB | CLS after |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
];
for (const row of after.summary) {
  const old = before.summary.find(
    (item) => item.route === row.route && item.profile === row.profile,
  );
  if (!old) throw new Error(`Missing baseline for ${row.profile} ${row.route}`);
  lines.push(
    `| ${row.profile} ${row.route} | ${old.fcpMs} → ${row.fcpMs} | ${old.lcpMs} → ${row.lcpMs} | ${old.blockingMs} → ${row.blockingMs} | ${Math.round(old.resourceBytes / 1024)} → ${Math.round(row.resourceBytes / 1024)} | ${row.cls} |`,
  );
}
const output = process.env.GITHUB_STEP_SUMMARY;
if (!output) throw new Error('GITHUB_STEP_SUMMARY must point to the workflow summary.');
appendFileSync(output, lines.join('\n') + '\n');
