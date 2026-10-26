# Architecture and editing map

React and TypeScript own the application; Vite builds static files. Three runtime dependencies are retained: React, React DOM and Typograf. Decorative motion uses native browser animation APIs and an active-time animation clock. There is no application framework, state container, runtime styling library or backend to configure.

## Runtime and route loading

`src/main.tsx` mounts `ThemeProvider` → `LocaleProvider` → `App`. The app owns the persistent header/footer, motion context and one route boundary. `src/pages/HomePage.tsx` owns homepage section order.

`src/content/routes.ts` is the single typed manifest for paths, metadata and route groups. `SitePath` and `SiteLink` derive from it; the latter includes hash destinations. `src/app/paths.ts` handles the hosting base. `src/app/router.ts` owns history, scroll restoration, focus, metadata and transitions. `RouteReady` sits inside Suspense and reports the committed destination; pending readiness is cancelled when another navigation starts. No DOM polling is used. `routeModules.ts` maps groups to lazy imports and warms the exact module before navigation. Failed warm-up is evicted so a later attempt can recover. Explicit links focus their anchor, or the page heading when no anchor resolves. Back/Forward and reload restore the saved reading position before considering a URL fragment; repeated links to the current route scroll without adding a history entry. Mobile navigation releases its dialog before either scroll or focus moves. Scroll events retain the current entry’s exact position in memory; history snapshots are written at most twice a second and flushed before link navigation or document exit. This avoids History API rate limits during continuous scrolling.

Route modules are lazy loading entrypoints. Corporate, Platform, Commercial and Research import their implementations from the matching subdirectory. This preserves one download boundary per group while making each page independently editable. The three use cases share one typed content record and one presentation template; legal documents likewise share one renderer. Do not duplicate these templates merely to create one file per URL.

`/developers/api/docs` has its own documentation loading group, compact reading layout and content tables. Its reference data and styles stay outside the Commercial and Home graphs. The API overview retains `#documentation` as a short first-request section linking to the full reference.

`/docs/investors` loads its corporate page implementation independently and uses the shared editorial frame and artwork.

Vite groups the mandatory React, React DOM, scheduler and Typograf modules in one shared `site-runtime` chunk. Lazy page entrypoints retain their separate loading boundaries.

One Suspense boundary avoids intermediate empty inner-page renders. A viewport-sized cold-load fallback keeps the footer below the first screen. Legal remains independent of shared illustrated page frames and animation engines. Route HTML contains metadata and preload hints for the current page’s styles and display fonts; full content is client-rendered. Language catalogs and styles load in parallel. Initial route imports remain owned by Suspense so an unfinished page download does not block document loading in WebKit. Preloaded CSS retains its normal import order.

Build-time JavaScript `modulepreload` and `preload as="script"` are disabled because WebKit can retain failed preloaded responses across reloads. CSS/font hints and router warming remain enabled; optional motion and other pages stay deferred. Re-enable script preloads only after network and HTTP-error recovery checks pass in supported Safari versions. See [WebKit issue 270357](https://bugs.webkit.org/show_bug.cgi?id=270357).

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

Runtime image resolvers use the named `assetDirectories` and `artwork` exports from `src/content/asset-manifest.ts`. The complete catalog remains the source for TypeScript asset names and build-time inventory validation.

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

The three composition stylesheets are ordered CSS import manifests. Their subdirectories name homepage sections, shared reading structures and compact examples. Imports are inlined by Vite; they do not create extra runtime stylesheet requests. Foundation and responsive/editorial adaptation modules remain explicitly ordered because the same selectors participate in the cascade.

Edit the relevant existing rule instead of appending another patch layer. Do not move lazy CSS into the initial bundle or replace the cascade with a framework for directory neatness. [Styles](STYLES.md) maps each composition; [Site grid](SITE-GRID.md) defines shared rails.

## State, motion and text

Theme resolves before React from `src/theme/bootstrap.ts`. The `scripts/theme-bootstrap.ts` Vite plugin compiles it into a synchronous script in the document head, before styles and application modules, so saved preferences apply without an extra request or a theme flash. Providers manage manual/system changes. Every published route has English, Russian and Traditional Chinese editions, including investor, corporate and legal pages. `LocaleProvider` owns text context; the chosen locale catalog loads before the first React render. Legal document bodies are loaded for the selected locale without an intermediate English body; the language selector provides access to the unchanged English originals without a separate translation notice. After catalog initialization, the page renders immediately; visual engines initialize independently without a full-page readiness gate. Runtime Typograf stays in `i18n/typography.ts`: authors write ordinary text, without a special preparation step. Its English and Russian engines initialize only when first needed; Chinese text bypasses them. `Text` emits the requested semantic tag and formats authored text and native inline children; `LocaleText` covers existing localized labels. Code, form values, legal source HTML and explicit verbatim content are not transformed.

`MotionProvider` follows reduced-motion preferences and keeps its context stable between preference changes. The route subtree is memoized so footer readiness does not render the page a second time. `useNearViewport` mounts lazy scenes once. `observeViewportActivity` combines viewport and document visibility for the small canvas owners and marquee; render loops and motion policy stay with each owner. Visual wrappers dispose their engines. `MorphPanel` animates measured height while retaining one readable state; interrupted updates resume from the current height. Home Capabilities instead keeps all five panels in one grid cell so their intrinsic content reserves the required height; inactive panels are hidden, `aria-hidden` and `inert`. The developer API example uses a stable, internally scrollable code viewport and reserves the height of both request/response notes. `AnimatedDetails` preserves native keyboard behavior. Evidence playback loads near the viewport and advances only during active visible time. Scroll-driven reading positions are remeasured when layout changes, and the pricing dock skips collision work outside its section. Decorative canvas owners cache style/size reads and reuse point data between frames. Every effect must clean up observers, listeners, timers, animation frames and changed inline styles.

The manual investigation example is owned by `InvestigationWorkbench.tsx`, `InvestigationScene.tsx`, `investigationDemo.ts` and its scoped `InvestigationWorkbench.css`. Its three stages are Query, Results and Host; synthetic service responses, TLS details and hostname refinement stay local. Home product-evidence playback is independent of these manual controls.

Legal HTML is compiled from reviewed repository Markdown with raw HTML rejected. No user-provided or remote HTML is injected at runtime. Integration limits and owner inputs are in [Handoff](HANDOFF.md).
