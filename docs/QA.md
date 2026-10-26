# Quality assurance

## Current release contract

```sh
npm ci
npm run check
npm run build
npx playwright install chromium
npm run test:release
```

`tests/acceptance/` contains the current release contract; `playwright.suites.ts` selects that directory, so new acceptance specs are included automatically. Shared helpers live in `tests/helpers/`. The default config uses this list in Chromium, Firefox and WebKit (CLS measurements skip engines without the Layout Instability API); the release config selects Chromium. Independent accessibility cases share the existing two-worker CI pool. Firefox/WebKit jobs check initial navigation and download recovery before the full suite. Run `npx playwright test --list` to inspect the current case inventory. Results belong to the corresponding commit’s CI run. `test:smoke` and `test:production` are aliases of the current release checks, not historical tests. TypeScript checks every Playwright config and test.

`npm run check` verifies legal-source parity, static assets/licenses, visual engine hashes, shared style contracts, import boundaries/cycles and their fixture tests, required authored translation keys/catalog parity, formatting, lint and TypeScript. Builds enforce entry budgets of 335 KiB JavaScript and 32 KiB CSS (uncompressed), plus gzip budgets for each route group including the initial application and all static dependencies. `scripts/verify-bundle.ts` owns the exact limits. The standalone API documentation has its own route budget; its acceptance tests cover all eight methods, code copying and selection fallback, localized navigation, and expanded tables at 320/390/768/1440 px in both themes. At narrow widths, field/type/default and description stack within semantic table rows; the plan-rate and error-status tables retain columns. The loading-performance suite checks cold-load CLS under delayed downloads and verifies that Legal does not request homepage/artwork/animation chunks.

The responsive-container acceptance cases constrain a data lens, query fragment, product evidence panel and monitoring asset selector while the viewport remains wide. They also check actual document overflow at intermediate widths. These scenarios run in the focused Chromium/Firefox/WebKit suite, not only in the full release contract. The full contract also includes `panel-stability`: three locales at five widths produce 15 cases per engine, checking unchanged section geometry during Capabilities/filter and API Request/Response switches, inactive-panel focus exclusion, and code scrolling/reset.

The general accessibility gate scans every available route plus a missing route in each locale: all route states in two themes at 390/1440 px. It checks document language, failed local resources and WCAG-tagged axe rules, including label-in-name. Localized interaction scans additionally cover the language menu, mobile navigation, pricing dialog and invalid Contact submission in RU and Traditional Chinese in both themes. CI installs Noto CJK; local runners need a script-capable font as well. These checks complement manual reading and assistive-technology review.

## Reproducible clean-room handoff

For pull requests, `handoff-package` runs after the full Chromium, Firefox and WebKit acceptance suites pass. It exports the accepted branch commit as a history-free ZIP, verifies asset/font/engine notices and absence of review/archive/local materials, installs dependencies from the ZIP in a separate directory, runs `npm run check`, and runs `test:relocation` at `/recipient-site/` and `/`. The relocation suite covers direct route/navigation recovery, missing-route recovery after scrolling, same-origin asset delivery, Russian font URLs and public configuration. A further root build overrides the product/sign-in destinations and reruns the same relocation contract, including the rendered links, internal documentation destination and static no-JavaScript fallback. The verified ZIP is attached as a short-lived workflow artifact. This tests source portability, not final product-owner signoff, real-device visual acceptance or live SaaS integrations.

## Cross-browser checks

```sh
npx playwright install chromium firefox webkit
npm run test:cross-browser
```

The focused contract covers routes, interactions, navigation/history/focus, themes/artwork, forms, recovery, shared internal hero geometry with the compact Pricing introduction, and navigation-order-independent styles. `npm test` runs the full current contract in all three engines and takes longer. Main pushes and manual publishing dispatches require the full Chromium, Firefox and WebKit acceptance contract before deployment, then run the Chromium contract against the actual Pages URL. Pull requests validate without publishing. `test:cross-browser` remains a faster focused local diagnostic, not sufficient by itself for final multi-engine signoff.

Set `APCO_BASE_URL=https://your-host/path/` to test an already deployed build. For a local build at a different subdirectory, set `APCO_TEST_BASE_PATH=/your-path/` so Playwright starts the preview at the same path. Set `APCO_TEST_PORT=4198` if the default 4187 port is occupied; tests never attach to an existing local preview automatically. Otherwise Playwright starts the local preview on port 4187. The default preview path is `/apcoseb-clear/`. For root/subpath verification, run the matching preview explicitly and pass its URL through `APCO_BASE_URL`.

Test artifacts are under `test-results/` and `playwright-report/`, excluded from Git. Failed runs must be investigated; do not regenerate screenshots simply to clear a failure. Optional `APCO_CHROMIUM_EXECUTABLE`, `APCO_FIREFOX_EXECUTABLE`, `APCO_WEBKIT_EXECUTABLE` point to installed test browsers. These paths are local environment values, not committed configuration.

## Visual acceptance and coverage limits

Release tests cover approved interactions, page structure, accessible names, overflow and asset decoding. They do not establish pixel equivalence for every animated frame. For visual changes, compare rendered desktop and mobile screens in both themes and obtain design approval before updating any reference snapshots.

Automated accessibility scans do not establish full WCAG conformance. Browser emulation does not replace physical iOS/Android testing or manual assistive-technology review. Demo data, external integrations, pricing/legal decisions and performance under real traffic require owner validation.

## Controlled performance measurements

After `npm run build`, run `npm run measure:performance`. The script starts its own preview, uses fresh Chromium contexts and writes `.work/performance.json`. Options: `--runs 3`, `--dist dist`, `--output <file>`, `--routes /,/ru/,/about/`, `--screenshots <directory>`; `APCO_BASE_URL` measures an existing host instead. Use `APCO_CHROMIUM_EXECUTABLE` only for a nonstandard local browser installation.

The matrix covers Home, About and Privacy, desktop and a 390 px viewport with 4× CPU throttling, 80 ms latency and 1.6 Mbps download. Each route/profile has three cold-cache samples with live motion. Do not run other browser suites concurrently when comparing measurements. The JSON includes browser version, timestamp, profiles, raw samples and medians, plus FCP, LCP, CLS and transferred bytes grouped into scripts, styles, fonts and images. Optional first-screen screenshots are captured after the load measurements.

The separate `Compare page performance` workflow builds the PR base and candidate, then measures both sequentially on the same runner with the same Chromium and network settings. Its matrix adds the Russian and Traditional Chinese homepages, Investors and API documentation. Measurements and screenshots are attached to the run; the job summary compares medians. This job runs separately from acceptance tests to avoid competing browser workloads. Manual runs accept a baseline commit.

These are lab samples, not field Core Web Vitals. `blockingMs` sums the portion of long tasks above 50 ms until the load checkpoint; it is not Lighthouse TBT. `clickToFrameMs` and `observedEventMs` describe one menu/theme interaction, not page INP. Remote transfer timing can omit bytes where timing access is unavailable. Real production latency, hardware and traffic still need field monitoring.
