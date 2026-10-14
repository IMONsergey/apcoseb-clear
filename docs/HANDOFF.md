# Developer handoff

This is the Apcosys marketing website, including internal informational pages. It is not the authenticated application. Current operating guides are linked in [the documentation index](README.md).

## First working session

1. Check out the agreed commit. Keep `package-lock.json`; use Node 22.12+.
2. Run `npm ci`, `npm run check`, `npm run build`.
3. Run `npx playwright install chromium` and `npm run test:release`.
4. Run `npm run dev`; open `http://127.0.0.1:5187/apcoseb-clear/`.
5. Review the homepage, one route from each page group, Pricing and a legal page in both themes, including a mobile viewport.

For all three engines, install `chromium firefox webkit` and run `npm run test:cross-browser`. See [QA](QA.md) for actual evidence and limits. A green test run is not a visual or content approval.

## Product boundary and delivery status

| Feature      | What this repository does                                                           | Owner input for a live integration                                   |
| ------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Search       | Sends the query to the external product `/search?search_value=…`                    | Confirm the product's supported query semantics                      |
| Sign In      | Opens the client product homepage; an optional verified route can override it       | Product homepage during migration; optional same-origin sign-in URL  |
| Registration | Links to external `/register`; selected pricing plan is not transferred             | Product registration/plan-selection contract                         |
| Pricing      | Displays owner-supplied plans and annual calculations; local comparison/dialogs     | Approved billing mechanics and checkout handoff                      |
| API          | Illustrative request/response and animation; no real API call or key storage        | Verified API reference and integration contract                      |
| Monitoring   | Explicitly labelled concept with synthetic states                                   | Product availability and data/alert contract                         |
| Contact      | Validates fields and opens a `mailto:` draft; nothing is sent or stored by the site | Backend/service if actual website delivery is required               |
| Cookies      | Stores an essential-only preference; no analytics integration                       | Approved consent/tracking model before adding analytics              |
| Legal pages  | Six repository-owned Markdown sources compiled to local pages                       | Owner review of the legal content; source updates must be deliberate |
| Languages    | English live; RU/CN unavailable controls retained                                   | Approved translations before enabling a locale                       |
| Themes       | System/manual choice; separate light/dark illustration files                        | Use existing tokens and `ThemedArtwork` for future illustrations     |

## Configuration

Copy `.env.example` to a local `.env` only if overriding defaults. `VITE_*` values are public and embedded at build time. Both Vite and the application validate product URLs, documentation URLs and the support email. Invalid settings fail the build. Rebuild after changing them.

Optional `APCO_PUBLIC_SITE_ORIGIN` sets static canonical/OG URLs for the final HTTPS origin. It is a build input, not a product URL. See [Deployment](DEPLOYMENT.md). Changing the support email updates site UI, not the preserved legal document bodies; legal amendments require owner review.

## Development contract

- Follow `src/pages/HomePage.tsx` for homepage order and `src/content/routes.ts` for route metadata.
- Import URL helpers from `src/app/paths.ts`; keep router lifecycle code out of page components.
- Page implementations live in `src/pages/<group>/`; shared frames and editorial components live in `src/components/layout/`. `npm run verify:architecture` enforces their dependency direction.
- Reuse `DoubleButton`, `Modal`, `AnimatedDetails`, `MorphPanel`, `PageFrame`, and `EditorialSection`. Use `Text` for ordinary authored text; it emits the same semantic tag and runs Typograf automatically.
- Edit subscription allowances only in `content/plans.ts`; the comparison, API and Business summaries derive from that record.
- Preserve shared container edges, right-aligned closing actions/footer metadata, natural content height and reduced-motion support.
- Use paired illustration assets; never derive the dark edition with CSS inversion.
- Preserve the six checksum-protected visual originals and font/GSAP notices.
- Edit legal Markdown, run `npm run legal:compile`, review the generated diff. Do not edit the JSON by hand.
- Keep demos marked as synthetic. Do not substitute invented production endpoints or credentials.

## Source package and acceptance

After changes are committed and the working tree is clean, run `npm run handoff:package`. It creates a ZIP in `.work/` from `HEAD`, with no `.git` directory or embedded source-commit marker. It includes the current source, acceptance tests, assets, license notices and maintenance guides; it excludes dependencies, build output and local reports. The source commit is printed separately for release records.

On pull requests, CI additionally runs the `handoff-package` job. It extracts the ZIP outside the original source tree, verifies that history/review material is absent and required licenses are present, runs a fresh locked install and full static checks, then builds and browser-smoke-tests both a renamed repository subpath and a root-domain deployment. Download the ZIP from the successful workflow's `apcosys-web-clean-source-*` artifact; do not replace it with a ZIP of the old Git working directory.

Provide the accepted commit, ZIP, successful Chromium and cross-browser checks, clean-room CI result, deployment URL and any remaining owner decisions. Verify all links and forms after deploying to the recipient's hostname. Hosting account ownership, environment variables and repository permissions must be transferred separately by their owners.

## Maintenance boundaries

Typography uses 12 discrete size steps, six line heights and five shadow recipes. `verify:styles` enforces these limits. Use the [style ownership map](STYLES.md) and change the original rule, including its responsive states, rather than appending a competing override.

Source files have strict import boundaries, route-typing checks and a filename-collision guard to preserve compatibility with case-insensitive filesystems. The site is client-rendered: route HTML has static metadata and a no-JavaScript fallback, but complete HTML content is rendered by React. If public SEO requirements change, evaluate prerendering/SSR separately rather than silently adding infrastructure.

Cold-load measurements are laboratory samples, not field performance scores. Real mobile devices, assistive-technology checks, external product endpoints and legal/commercial content still require final owner acceptance.
