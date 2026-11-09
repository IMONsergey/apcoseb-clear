# Developer handoff

This repository contains the Apcosys marketing website and its informational pages. The authenticated product is a separate application. Current operating guides are linked in [the documentation index](README.md).

## First working session

1. Check out the agreed commit. Keep `package-lock.json`; use Node 22.13 or later.
2. Run `npm ci`, `npm run check`, `npm run build`.
3. Install `chromium firefox webkit` with Playwright and install Noto CJK fonts for Traditional Chinese geometry checks.
4. Run `npm run test:release` for the full Chromium contract or `npm test` for the full contract in all three engines.
5. Run `npm run dev`; open the URL printed by Vite, normally `http://127.0.0.1:5187/apcoseb-clear/`.
6. Review all page groups, Pricing and legal content in both themes and at narrow and wide widths.

`npm run test:cross-browser` runs a smaller focused interaction suite. It does not replace the full three-engine release gate. See [QA](QA.md) for commands and the commit’s GitHub Actions run for results. Automated checks complement visual and editorial review.

## Product boundaries

| Feature           | Repository behavior                                                                                                              | Separate product or owner responsibility                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Search            | Provides local example investigations and sends a submitted query to the external product's `/search?search_value=…` route       | Product query execution and account permissions                                                        |
| Account entry     | Opens `/login` on the configured product origin; supports a same-origin override                                                 | Registration, authentication and account recovery inside the product                                   |
| Pricing           | Shared plan data, annual default and calculations, comparison dialogs, chosen-plan summary and account entry in another tab      | Checkout, actual subscription selection and payment; the site does not invent a plan-transfer URL      |
| API               | Published HTTP request example using `X-API-Key` and `/api/v1/search/hosts`; documented response structure with synthetic values | The live API, credentials, subscription permissions and current endpoint behavior                      |
| Coverage          | Dated snapshot from the public statistics endpoint, with its source and update date                                              | Current totals and authoritative counting/deduplication definitions                                    |
| Monitoring        | Explicitly labelled concept with synthetic states                                                                                | Product availability and data/alert contracts                                                          |
| Contact           | Required-field validation, accessible Topic selector, per-tab draft for up to 24 hours and one Email us action preparing mailto  | Message delivery through the user's email application; a backend is needed for direct website delivery |
| Cookies           | Essential preference storage; no optional analytics or marketing trackers enabled                                                | Consent/tracking design if optional analytics is added                                                 |
| Legal pages       | Six preserved English Markdown sources and full RU/Traditional Chinese reference translations, compiled separately by locale     | Legal approval and deliberate amendments to the authoritative English text                             |
| Languages         | All published routes in EN, RU and Traditional Chinese, plus localized 404 handling                                              | Editorial approval of terminology and final-host verification                                          |
| Themes and motion | System/manual theme choice, paired artwork, six rebuilt application scenes, complete reduced-motion frames                       | Physical-device acceptance and future asset changes                                                    |

The six product/API scenes use React HTML, shared vector assets and native browser animation. Preserve the remaining asset notices and integrity checks. Synthetic demonstrations must remain clearly labelled, and animation failure must not hide readable content.

Commercial decisions still include the mapping between Free/Plus/Expert/Business plans and the license's Personal/Free and Business/Enterprise categories. No additional usage rights are inferred for Plus or Expert. The supplied client HTTP contract now defines its credit weights, raw-body charge reuse and separate server token-bucket rate limits in the canonical OpenAPI snapshot. Do not substitute the marketing pricing-table API rates or apply the client rules to website-session/WebSocket methods. Annual credit renewal, expiry, rollover and any remaining Search Token conversion still require their actual rules; do not calculate request capacity from an assumed conversion. See [Product integrations](reference/PRODUCT-INTEGRATIONS.md) for the dated source chain and confirmed values. A future automatic checkout handoff, direct Contact delivery, final public domain and indexing policy also require their actual receiving systems or owner decisions.

## Configuration

Copy `.env.example` to a local `.env` only when overriding defaults. `VITE_*` values are public. Vite validates product/sign-in URLs and the support email before serving or building, then embeds the validated values in the application. Invalid settings fail the build. Rebuild after changing them.

| Setting                   | Default or behavior                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_APCO_PRODUCT_URL`   | `https://apcosys.net`; an origin without a path, query or fragment                                                                         |
| `VITE_APCO_SIGN_IN_URL`   | `/login` on the product origin; an override must stay on that origin                                                                       |
| `VITE_APCO_API_SPEC_URL`  | Optional public OpenAPI 3.1.1 JSON URL; no remote default; invalid/unavailable documents use the bundled reference                         |
| `VITE_APCO_SUPPORT_EMAIL` | `info@apcosys.net`                                                                                                                         |
| `APCO_PUBLIC_SITE_ORIGIN` | Optional locally; GitHub workflows default to the repository owner's Pages origin; controls static canonical/OG/alternate URLs and sitemap |
| `APCO_SITE_INDEXABLE`     | `false` by default; `true` requires a valid HTTPS marketing origin                                                                         |
| `APCO_SITE_BASE`          | GitHub workflow destination path; local builds use the `--base` option                                                                     |

Documentation links use the localized page at `/developers/api/docs`, including the hosting base path. The full client HTTP reference is derived from `public/api/client.openapi.json`, optionally replaced by a validated anonymous document fetch. See [Public API documentation source](PUBLIC-API-DOCUMENTATION.md) for replacement, fallback, profile and test requirements. The legacy `/developers/api#documentation` anchor still opens the overview’s short first-request section, with a link to the full reference. Investor enquiries use `/docs/investors` and the dedicated `rk@apcosys.net` address.

Changing the support email updates site UI, not the preserved legal document bodies. Legal amendments require review. See [Deployment](DEPLOYMENT.md) for origin, indexing and host configuration.

## Development contract

- Follow `src/pages/HomePage.tsx` for homepage order and `src/content/routes.ts` for route metadata.
- Import URL helpers from `src/app/paths.ts`; keep router lifecycle code out of page components.
- Page implementations live in `src/pages/<group>/`; shared frames and editorial components live in `src/components/layout/`. `npm run verify:architecture` enforces their dependency direction.
- Reuse `DoubleButton`, `Modal`, `AnimatedDetails`, `MorphPanel`, `PageFrame` and `EditorialSection`. Use `Text` for ordinary authored text; it preserves the semantic tag and applies typography rules.
- Edit marketing subscription allowances only in `src/content/plans.ts`; comparison, overview and Business summaries derive from that record. The full public client HTTP reference instead derives from `public/api/client.openapi.json`. Its credit weights and server token-bucket limits are separate from marketing pricing data. Keep client HTTP examples separate from the authenticated application's session/WebSocket protocol.
- Update `src/content/metrics.ts` only from an identified statistics response, keeping its timestamp and source together. Do not turn fields into claims about unique systems or vulnerable hosts without a verified definition.
- Preserve shared container edges, readable line lengths, natural content height, keyboard access and reduced-motion support.
- Use paired illustration assets; do not derive the dark edition with CSS inversion.
- Preserve the integrity checks for the visual engines and retain all applicable font and asset notices.
- Edit legal Markdown, run `npm run legal:compile`, then review the generated JSON diff. The compiler verifies source hashes, edition metadata, section structure and protected source facts. Do not edit compiled legal JSON by hand.
- Keep demos marked as synthetic. Do not substitute invented production endpoints or credentials.

## Source package and acceptance

After changes are committed and the working tree is clean, run `npm run handoff:package`. It creates a ZIP in `.work/` from `HEAD`, with no `.git` directory or embedded source-commit marker. It includes current source, acceptance tests, assets, license notices and maintenance guides; it excludes dependencies, build output and local reports. The source commit is printed separately for release records.

On pull requests, CI runs the `handoff-package` job after full browser validation. It extracts the ZIP outside the original source tree, verifies archive boundaries and required licenses, installs locked dependencies, runs all static checks, then builds and runs `test:relocation` at a renamed repository subpath, at the root, and with custom product/sign-in destinations. Documentation links remain on-site in every configuration. Download the ZIP from the successful workflow's `apcosys-web-clean-source-*` artifact.

On `main`, the release workflow requires source checks, the production build and the complete Chromium, Firefox and WebKit contracts before Pages deployment. The deployed URL then receives the full Chromium contract. Manual dispatch on `main` uses the same gate. Provide the accepted commit, successful workflow run, deployment URL and any remaining owner decisions; do not infer publication merely from a local build or prepared source tree.

Repository permissions, hosting ownership and environment configuration are transferred separately by their owners.

## Maintenance boundaries

Typography uses 12 discrete size steps, six line heights and five shadow recipes. `verify:styles` enforces these limits. Use the [style ownership map](STYLES.md) and change the original rule and its responsive states rather than adding a competing override.

Source files have strict import boundaries, route-typing checks and a filename-collision guard for case-insensitive filesystems. The site is client-rendered: route HTML has static metadata and a no-JavaScript fallback, while React renders complete content. Evaluate prerendering or SSR separately if public SEO requirements change.

Cold-load measurements are laboratory samples. Browser-engine tests do not establish physical iOS/Android device or complete assistive-technology approval. External account behavior and legal/commercial content remain separate acceptance responsibilities.
