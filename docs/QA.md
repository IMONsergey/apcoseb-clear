# Quality assurance

## Current release contract

```sh
npm ci
npm run check
npm run build
npx playwright install chromium
npm run test:release
```

`tests/acceptance/` contains the current release contract; `playwright.suites.ts` selects that directory, so new acceptance specs are included automatically. Shared helpers live in `tests/helpers/`. The default config uses this list in Chromium, Firefox and WebKit (CLS measurements skip engines without the Layout Instability API); the release config selects Chromium. `test:smoke` and `test:production` are aliases of the current release checks, not historical tests. TypeScript checks every Playwright config and test.

`npm run check` verifies legal-source parity, static assets/licenses, visual engine hashes, shared style contracts, import boundaries/cycles and their five fixture tests, formatting, lint and TypeScript. Builds enforce entry budgets of 335 KiB JavaScript and 32 KiB CSS (uncompressed), plus gzip budgets for each route group including its static dependencies. `scripts/verify-bundle.mjs` owns the exact limits. The loading-performance suite checks cold-load CLS under delayed downloads and verifies that Legal does not request homepage/artwork/animation chunks.

The responsive-container acceptance cases constrain a data lens, query fragment, product evidence panel and monitoring asset selector while the viewport remains wide. They also check actual document overflow at intermediate widths. These scenarios run in the focused Chromium/Firefox/WebKit suite, not only in the full release contract.

## Reproducible clean-room handoff

For pull requests, `handoff-package` runs after the full Chromium release suite passes. It exports the accepted branch commit as a history-free ZIP, verifies asset/font/engine notices and absence of review/archive/local materials, installs dependencies from the ZIP in a separate directory, runs `npm run check`, and smoke-tests route/navigation recovery at `/recipient-site/` and `/`. The verified ZIP is attached as a short-lived workflow artifact. This tests source portability, not final product-owner signoff, real-device visual acceptance or live SaaS integrations.

## Cross-browser checks

```sh
npx playwright install chromium firefox webkit
npm run test:cross-browser
```

The focused contract covers routes, interactions, navigation/history/focus, themes/artwork, forms, recovery, equal internal hero heights and navigation-order-independent styles. `npm test` runs the full current contract in all three engines and takes longer. PR CI runs the **full current acceptance contract** in Chromium, Firefox and WebKit (`npm test`), while main CI runs the full Chromium contract before and after Pages deployment. `test:cross-browser` remains a faster focused local diagnostic, not sufficient by itself for final multi-engine signoff.

Set `APCO_BASE_URL=https://your-host/path/` to test an already deployed build. For a local build at a different subdirectory, set `APCO_TEST_BASE_PATH=/your-path/` so Playwright starts the preview at the same path. Set `APCO_TEST_PORT=4198` if the default 4187 port is occupied; tests never attach to an existing local preview automatically. Otherwise Playwright starts the local preview on port 4187. The default preview path is `/apcoseb-clear/`. For root/subpath verification, run the matching preview explicitly and pass its URL through `APCO_BASE_URL`.

Test artifacts are under `test-results/` and `playwright-report/`, excluded from Git. Failed runs must be investigated; do not regenerate screenshots simply to clear a failure. Optional `APCO_CHROMIUM_EXECUTABLE`, `APCO_FIREFOX_EXECUTABLE`, `APCO_WEBKIT_EXECUTABLE` point to installed test browsers. These paths are local environment values, not committed configuration.

## Visual acceptance and coverage limits

Release tests cover approved interactions, page structure, accessible names, overflow and asset decoding. They do not establish pixel equivalence for every animated frame. For visual changes, compare rendered desktop and mobile screens in both themes and obtain design approval before updating any reference snapshots.

Automated accessibility scans do not establish full WCAG conformance. Browser emulation does not replace physical iOS/Android testing or manual assistive-technology review. Demo data, external integrations, pricing/legal decisions and performance under real traffic require owner validation.

## Controlled performance measurements

After `npm run build`, run `npm run measure:performance`. The script starts its own preview, uses fresh Chromium contexts and writes `.work/performance.json`. Options: `--runs 3`, `--dist dist`, `--output <file>`; `APCO_BASE_URL` measures an existing host instead. Use `APCO_CHROMIUM_EXECUTABLE` only for a nonstandard local browser installation.

The matrix covers Home, About and Privacy, desktop and a 390 px viewport with 4× CPU throttling, 80 ms latency and 1.6 Mbps download. Each route/profile has three cold-cache samples with live motion. Do not run other browser suites concurrently when comparing measurements. The JSON includes browser version, timestamp, profiles, raw samples and medians.

These are lab samples, not field Core Web Vitals. `blockingMs` sums the portion of long tasks above 50 ms until the load checkpoint; it is not Lighthouse TBT. `clickToFrameMs` and `observedEventMs` describe one menu/theme interaction, not page INP. Remote transfer timing can omit bytes where timing access is unavailable. Real production latency, hardware and traffic still need field monitoring.
