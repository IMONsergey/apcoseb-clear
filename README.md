# Apcosys website

React 19, TypeScript and Vite marketing website with English, Russian and Traditional Chinese editions, Light/Dark/System themes, legal documents and interactive product demonstrations. The authenticated product is a separate application. Start with the [developer handoff](docs/HANDOFF.md).

All authored executable code uses TypeScript (`.ts` or `.tsx`), including configuration and build scripts. HTML, CSS and JSON retain their native formats. Vite produces JavaScript for browsers; dependencies and build output are outside the source-only rule, which `npm run verify:source` enforces.

## Local setup

Use Node.js 22.13+ (Node 22 in `.nvmrc` and CI) and the committed npm lockfile.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5187/apcoseb-clear/`. Public build settings are documented in `.env.example`; no frontend variable may contain a secret.

## Verification and build

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:release
```

| Command                                  | Purpose                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                          | Legal-source parity, asset inventory, engine integrity, style and architecture contracts, formatting, lint and TypeScript |
| `npm run verify:localization`            | Check required authored UI messages, catalog placeholders and translated route metadata                                   |
| `npm run verify:architecture`            | Check import boundaries, runtime cycles and the guard’s fixture tests                                                     |
| `npm run verify:styles`                  | Check shared style contracts and print the source inventory                                                               |
| `npm run build`                          | GitHub Pages build at `/apcoseb-clear/`, route metadata and bundle budgets                                                |
| `npm run build:root`                     | Same checks for deployment at `/`                                                                                         |
| `npm run build -- --base=/site/`         | Same build at another subdirectory                                                                                        |
| `npm run preview`                        | Serve the existing Pages build at `http://127.0.0.1:4187/apcoseb-clear/`                                                  |
| `npm run test:release`                   | Full current release contract in Chromium                                                                                 |
| `npm run measure:performance`            | Cold-cache Chromium lab measurements; see QA for routes and profiles                                                      |
| `npm run test:relocation`                | Check configured URLs, deep links, 404 recovery and localized fonts at the built hosting base                             |
| `npm run test:cross-browser`             | Current core interactions in Chromium, Firefox and WebKit                                                                 |
| `npm test`                               | Full current contract in all three engines; install them first                                                            |
| `npm run test:smoke` / `test:production` | Aliases of the current Chromium release checks                                                                            |
| `npm run handoff:package`                | Export a clean, history-free source ZIP from the committed tree                                                           |

The current Playwright acceptance suite is the release baseline. Visual changes still require manual review across supported viewports and themes. See [QA](docs/QA.md).

## Where to work

| Area                                           | Entry point                               |
| ---------------------------------------------- | ----------------------------------------- |
| Application, navigation and loading            | `src/App.tsx`, `src/app/`                 |
| Homepage composition                           | `src/pages/HomePage.tsx`                  |
| Internal page content and layout               | `src/pages/`, `src/components/product/`   |
| Shared page layouts                            | `src/components/layout/`                  |
| Calculations and lifecycle helpers             | `src/lib/`                                |
| Shared controls                                | `src/components/ui/`                      |
| Copy, pricing, route metadata and demo records | `src/content/`                            |
| Product URLs and contacts                      | `src/config/`                             |
| Grid, typography and theme tokens              | `src/styles/tokens.css`                   |
| Visual engines and React adapters              | `src/visuals/`, `src/components/visuals/` |
| Static images and fonts                        | `public/`                                 |
| Preserved legal sources                        | `docs/legal-sources/`                     |

## Deployment and documentation

The official source repository is [IMONsergey/apcoseb-clear](https://github.com/IMONsergey/apcoseb-clear); its GitHub Pages target is https://imonsergey.github.io/apcoseb-clear/. Confirm the successful publication workflow before sharing that URL. A main push runs the full Chromium, Firefox and WebKit acceptance gates before publication, followed by Chromium checks against the actual deployment. Vercel root-build settings are included, but hosting must be connected separately. Review copies default to `noindex`; `APCO_SITE_INDEXABLE=true` requires a valid final HTTPS site origin.

- [Developer handoff and integration boundaries](docs/HANDOFF.md)
- [Replaceable public OpenAPI documentation source](docs/PUBLIC-API-DOCUMENTATION.md)
- [Move into a fresh repository](docs/MIGRATION.md)
- [Architecture and editing recipes](docs/ARCHITECTURE.md)
- [Localization strategy and translation release gates](docs/LOCALIZATION.md)
- [Deployment and rollback](docs/DEPLOYMENT.md)
- [Quality assurance](docs/QA.md)
- [Grid](docs/SITE-GRID.md), [assets](docs/ASSETS.md), [visual engines](docs/VISUALS.md)
- [Documentation index](docs/README.md) — maintenance guides and legal source files
