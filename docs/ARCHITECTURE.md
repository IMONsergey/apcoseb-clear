# Architecture and editing map

React and TypeScript own the application; Vite builds static files. Four runtime dependencies are deliberately retained: React, React DOM, GSAP and Typograf. There is no application framework, state container, runtime styling library or backend to configure.

## Runtime and route loading

`src/main.tsx` mounts `ThemeProvider` → `LocaleProvider` → `App`. The app owns the persistent header/footer, motion context and one route boundary. `src/pages/HomePage.tsx` owns homepage section order.

`src/content/routes.ts` is the single typed manifest for paths, metadata and route groups. `SitePath` and `SiteLink` derive from it; the latter includes hash destinations. `src/app/paths.ts` handles the hosting base. `src/app/router.ts` owns history, scroll restoration, focus, metadata and transitions. `RouteReady` sits inside Suspense and reports the committed destination; pending readiness is cancelled when another navigation starts. No DOM polling is used. `routeModules.ts` maps groups to lazy imports and warms the exact module before navigation. Failed warm-up is evicted so a later attempt can recover.

The seven top-level page modules are **loading entrypoints**, not containers for all page implementations. Corporate, Platform, Commercial and Research import their implementations from the matching subdirectory. This preserves one download boundary per group while making each page independently editable. The three use cases share one typed content record and one presentation template; legal documents likewise share one renderer. Do not duplicate these templates merely to create one file per URL.

One Suspense boundary avoids intermediate empty inner-page renders. A viewport-sized cold-load fallback keeps the footer below the first screen. Legal remains independent of shared illustrated page frames and animation engines. Route HTML contains metadata; full content is client-rendered.

Build-time JavaScript `modulepreload` is disabled because WebKit can retain failed preloaded modules. Router warming remains enabled. Re-enable it only after the network failure and recovery checks pass in supported Safari versions. See [WebKit issue 270357](https://bugs.webkit.org/show_bug.cgi?id=270357).

## Ownership and dependency rules

| Location                   | Owns                                                             | Depends on                                            |
| -------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `src/app/`                 | Routing, URL resolution, startup and route loading               | Route metadata; lazy page entrypoints                 |
| `src/pages/<group>/`       | Page composition, local copy and page-specific state             | Shared layouts, controls, product examples, content   |
| `src/components/layout/`   | PageFrame, page artwork, editorial groups and link helpers       | UI, hooks, content and URL helpers                    |
| `src/components/sections/` | Homepage sections and reusable pricing section                   | Layout-independent product components, UI and content |
| `src/components/product/`  | Contained interactive examples                                   | Shared layout/UI, hooks and demo content              |
| `src/components/ui/`       | Buttons, dialogs, disclosure and transition primitives           | Hooks, theme, typography and content types            |
| `src/content/`             | Navigation, route metadata, metrics, plans and synthetic records | Configuration and other data; no runtime UI           |
| `src/lib/`                 | Small calculations and browser lifecycle helpers                 | No page or component ownership                        |
| `src/config/`              | Validated public settings                                        | No runtime UI                                         |
| `src/styles/`              | Shared design roles and ordered component composition            | No runtime CSS generation                             |
| `src/visuals/`             | Supplied engines and their adapters                              | See protected-source contract in VISUALS              |

`npm run verify:architecture` reads the working tree, including untracked source. It rejects runtime import cycles, shared modules importing pages (including type imports), data/configuration importing runtime UI, UI primitives importing composed components, and imports between page families. Its fixture tests cover both accepted and rejected dependency graphs. It runs in `npm run check` and therefore in CI.

Import shared code directly from its owner. Avoid barrel files that conceal dependency direction or drag an entire feature into a lazy chunk. A page-local helper stays next to its page until it has another real consumer. Sharing similar-looking JSX is useful only when behavior and ownership also match.

## Editing recipes

| Change                           | Files and checks                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Add a route to an existing group | `content/routes.ts`, group dispatcher and page implementation; update navigation, artwork and browser coverage      |
| Add a new lazy group             | Add a manifest group, loader and App mapping; TypeScript requires the loader mapping; define a bundle budget        |
| Navigation                       | `content/navigation.ts`; header/footer labels and destinations                                                      |
| Homepage                         | `pages/HomePage.tsx`, `components/sections/`; metrics in `content/metrics.ts`, walkthrough in `content/research.ts` |
| Internal content                 | `pages/platform/`, `research/`, `commercial/`, `corporate/`; layout primitives in `components/layout/`              |
| Pricing                          | `content/plans.ts`, `lib/pricing.ts`, `sections/PricingSection.tsx`, `pages/commercial/PricingPage.tsx`             |
| Contact form                     | `pages/corporate/ContactForm.tsx`, topics in `contactTopics.ts`; it opens a mail draft                              |
| Product example data             | `content/product-demo.ts`; preserve reserved addresses and demo labels                                              |
| Images                           | `components/layout/PageArtwork.tsx`, `content/asset-manifest.ts`, `public/assets/`; retain theme pairs              |
| Legal documents                  | `docs/legal-sources/` → `npm run legal:compile`; generated JSON is not edited manually                              |
| Public integrations              | `config/public-settings.ts`, `config/site.ts`; no secrets in frontend settings                                      |

## CSS composition

`main.tsx` establishes fonts → tokens/type roles → document base → shared controls/shell/navigation → responsive and interaction styles → footer/theme. Lazy page groups load their own styles. `PageFrame.tsx` imports page components → compact experience → inner pages. Preserve this order.

The three former large composition files are ordered CSS import manifests. Their subdirectories name homepage sections, shared reading structures and compact examples. Imports are inlined by Vite; they do not create extra runtime stylesheet requests. Foundation and responsive/editorial adaptation modules remain explicitly ordered because the same selectors participate in the cascade. Splitting them does not claim that every historical override has been eliminated.

Edit the relevant existing rule instead of appending another patch layer. Do not move lazy CSS into the initial bundle or replace the cascade with a framework for directory neatness. [Styles](STYLES.md) maps each composition; [Site grid](SITE-GRID.md) defines shared rails.

## State, motion and text

Theme resolves before React in `index.html`; providers manage manual/system changes. English is the published locale; RU and Traditional Chinese are enabled in local builds for reviewed marketing routes. `LocaleProvider` owns text context; the chosen locale catalog loads before the first React render. After catalog initialization, the page renders immediately; visual engines initialize independently without a full-page readiness gate. Runtime Typograf stays in `i18n/typography.ts`: authors write ordinary text, without a special preparation step. `Text` emits the requested semantic tag and formats authored text and native inline children; `LocaleText` covers existing localized labels. Code, form values, legal source HTML and explicit verbatim content are not transformed.

`MotionProvider` follows reduced-motion preferences. `useNearViewport` mounts lazy scenes once. `observeViewportActivity` combines viewport and document visibility for the small canvas owners and marquee; render loops and motion policy stay with each owner. Visual wrappers dispose their engines. `MorphPanel` animates measured height while retaining one readable state; interrupted updates resume from the current height. `AnimatedDetails` preserves native keyboard behavior. Evidence timelines load GSAP near the viewport. Every effect must clean up observers, listeners, timers and animation contexts.

Legal HTML is compiled from reviewed repository Markdown with raw HTML rejected. No user-provided or remote HTML is injected at runtime. Integration limits and owner inputs are in [Handoff](HANDOFF.md).
