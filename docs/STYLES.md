# Design system and style ownership

Change a shared role before adding a local value. Components own their geometry; the site owns its typography, palette and page rails. `npm run verify:styles` checks this contract and prints a reproducible inventory. It is part of `npm run check` and CI.

## Editing map

| Concern                                                       | Owner                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Semantic colors, spacing, radius, elevation and page rails    | `src/styles/tokens.css`                                                             |
| Font sizes, font recipes, tracking and responsive page titles | `src/styles/type-scale.css`                                                         |
| Document defaults, reset, container and accessibility helpers | `src/styles/base.css`                                                               |
| Dark palette and theme controls                               | `src/styles/theme.css`                                                              |
| Shared buttons and interaction states                         | `src/styles/controls.css`                                                           |
| Header and language disclosure                                | `site.css`, `navigation.css`, `localization.css`                                    |
| Homepage                                                      | `home-layout.css`, `home-product.css`, owning section CSS                           |
| Inner-page composition, reading groups and responsive grids   | `inner-pages.css`                                                                   |
| Reusable page components, workspaces and research scenarios   | `page-components.css`, `workspaces.css`, `research-scenarios.css`                   |
| Legal layout, navigation and print                            | `legal-pages.css`                                                                   |
| Contained product fragments and evidence motion               | `compact-experience.css`, `product-evidence.css`, `product-motion.css`              |
| Original rendering engines                                    | `src/visuals/`                                                                      |
| Application scene geometry and private light/dark palette     | `components/visuals/application/application-scene.css`, `application-api-scene.css` |

`main.tsx` establishes global order. Lazy page groups load their own CSS; do not promote it into the initial bundle solely to simplify imports. Do not add a new stylesheet whose only purpose is to override a previous review. Existing `stage-*` class names are stable component selectors, not a second design system.

## Ordered composition modules

The three entry stylesheets contain only ordered `@import` statements. Vite inlines these imports during the build; there are no extra browser requests.

| Entry                    | Modules in cascade order                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home-layout.css`        | `home-layout/frame`, `search-preview`, `trust-marquee`, `interaction-feedback`, `closing`, `responsive-frame`, `search-composition`, `research-carousel`, `audience`, `data`, `theme` |
| `inner-pages.css`        | `inner-pages/foundation`, `editorial-components`, `reading-rails`, `editorial-surfaces`, `content-adaptations`                                                                        |
| `compact-experience.css` | `compact-experience/product-fragments`, `responsive-fragments`, `search-contour`                                                                                                      |

Names above omit `.css`. Homepage modules follow actual section ownership; inner-page modules separate shared structure, reading layout and surfaces. Responsive adaptations retain their cascade position. Do not sort these imports alphabetically or append a new “fix” file. Find the existing rule and its later responsive states before editing. Keep responsive and interaction selectors separate where cascade order matters. Shared tablet hero sizing accommodates typographed copy. Pricing owns a compact introduction in its section stylesheet so visitors reach prices sooner without changing other page families.

## Typography

The ten font recipes are `--type-display`, `page`, `section`, `card`, `lead`, `body`, `small`, `control`, `code` and `metric`. Use `font: var(--type-body)` for a complete recipe, or a shared size token when a component owns its weight. Body and hero descriptions use 18 px; leads 20 px; card headings 24 px. Small text, code and controls reuse 14 px. These are real shared values, not independent aliases with slightly different overrides.

| Scale                | Values in px                       | Use                                                                |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Compact labels       | 10, 12                             | Contained previews and technical annotations, never editorial body |
| Reading and controls | 14, 16, 18, 20                     | Notes, controls, body and leads                                    |
| Headings/numerals    | 24, 32, 40, 48, 64, 80             | Responsive stops and metrics                                       |
| Fluid headings       | display, page, section, subsection | Shared responsive recipes; page families may adjust their inputs   |

There are **12 approved discrete size steps**. The `font-size` inventory reports the expressions actually used: scale references, fluid role references, the contained price formula, print point sizes and `inherit`. A step may be used through a `font` recipe rather than an explicit `font-size` declaration. Run `npm run verify:styles` for the current source count; it does not describe the number of computed sizes in the browser.

All declarations and font recipes share **six unitless line heights: 1, 1.1, 1.25, 1.5, 1.6, 1.7**. Tight display, heading, short title, interface, descriptive and long-form text respectively reuse these steps. No pixel line heights or local near-neighbours. Tracking roles remain display −0.05 em, heading −0.04 em, compact −0.025 em and label +0.04 em. Print retains physical point sizing; pricing numerals retain one container-relative formula.

Font recipes are redeclared on `.inner-pages` and `.legal-page` because nested custom properties resolve where declared. Do not remove those scopes. Runtime Typograf remains in `src/i18n/typography.ts`; authors provide ordinary text, with no special pre-processing.

## Spacing, grid and corners

| Token       | px  | Token        | px  |
| ----------- | --- | ------------ | --- |
| `--space-1` | 4   | `--space-6`  | 24  |
| `--space-2` | 8   | `--space-7`  | 32  |
| `--space-3` | 12  | `--space-8`  | 40  |
| `--space-4` | 16  | `--space-9`  | 48  |
| `--space-5` | 20  | `--space-10` | 64  |

Use these for ordinary margins, padding and gaps. `--layout-gap`, `--gutter`, `--section-space` and the density inputs own responsive page geometry; see [Site grid](SITE-GRID.md). Percentages, container-relative artwork coordinates, negative alignment offsets and fluid section spacing are deliberate geometry, not extra spacing tokens.

Corners: detail 2 px; control 5 px; panel 7 px; frame 12 px; scene 24 px; round 50%; pill 999 px. Most UI uses **control or panel**. Frame/scene belong to illustrated product screens. A straight edge is `0`; attached surfaces can inherit a parent radius. Do not introduce a new corner for one card.

There are **five shared shadow recipes**, including effects: `--shadow-low`, `popover`, `modal`, `inset` and `accent`. Only the first three are elevation levels and have dark-theme overrides. Floating disclosures reuse popover elevation. Search uses the shared form border and low shadow at rest; only `:focus-within` adds the accent outline and shadow, without a persistent gradient contour. Product demonstrations do not paint decorative focus rectangles. Interactive demonstration controls use a quiet selected background or underline; their keyboard focus remains visible through a contrasting surface and underlined text. Decorative metric glows were removed.

## Palette

- Surfaces: `--surface-page`, `card`, `elevated`, `strong`, `tint`.
- Text: `--text-primary`, `--color-text-body`, `--text-muted`.
- Controls: `--action-fill`, `--action-hover-fill`, `--on-action`, `--accent-text`, `--focus`.
- Dividers: `--border-subtle`, `--border-strong`.
- Art direction: `--brand-mark`, `--api-surface`, `--visual-ink`.

Dark values override the same roles. Do not restore synonyms such as `--white`, `--ink`, `--page` or `--line`. Masks, fixed-color artwork, print and theme adapters have separate physical requirements; their literals are included in the application inventory but are not public UI palette roles. Private engine styles under `src/visuals/` are excluded from that inventory and require their own rendered review. Dark illustrations are separate files, never inverted light files.

## Container-aware components

Use the CSS owner of each component to manage its internal density. `product-fragments.css` defines the inline-size query containers for Data Lens and Query Fragment; `responsive-fragments.css` contains their compact descendants. Product Evidence and plan cards also size their internal parts to their own width. Monitoring Assets owns its container and narrow grid rules in `workspaces.css`.

Keep window-width checks for the actual page shell, menu, billing dock and other viewport interactions. Do not add JavaScript media observers to reproduce a rule that CSS can resolve locally. Responsive behavior must be tested both at mobile viewport width and by constraining a component inside a wide viewport.

## Responsive rule inventory

`npm run verify:styles` reports both the number of `@media` blocks and the number of **distinct conditions**. One condition can legitimately appear in multiple component-owned CSS files; that is not the same as having an independent breakpoint for every block. The gate rejects adjacent identical `@media` blocks and unapproved typography, shadow and radius values.

Keep global viewport queries for navigation, shell composition, input-device preferences, reduced motion and print. Prefer intrinsic sizing and component-owned container queries for reusable nested interfaces. Remove a rule only when the earlier cascade already supplies its exact declaration, then verify layout at neighbouring widths and in both themes. Grouping every viewport query into one global stylesheet is not considered simplification if it obscures component ownership or changes lazy CSS loading.

## Verification and future edits

1. Reuse `DoubleButton` or `plain-button`; page CSS controls placement, not a new button design.
2. Reuse reading groups before adding a card family. Keep outer edges on `.container`.
3. Edit the owning rule, including its responsive states. A selector absent from literal JSX may be generated dynamically; do not delete it without checking consumers.
4. Run `npm run check`, `npm run build` and `npm run test:release`. The style gate rejects raw screen font sizes, new size steps, unapproved line heights (including font shorthands), local shadows and arbitrary radii outside documented exceptions.
5. `design-system.spec.ts` compares cold and client-navigated pages in both themes. `style-contract.spec.ts` checks legal alignment and Sign In; `inner-hero-layout.spec.ts` checks 12 viewport widths and doubled text.
6. For a measurable before/after report: `tsx scripts/verify-styles.ts --ref <commit>`. Its totals count source expressions, not computed styles or semantic roles. Fewer files or replacing every number with a variable is not proof of a simpler system.

Large composition files remain explicit CSS, rather than a new utility framework or runtime style library. The application has three runtime dependencies: React, React DOM and Typograf. Original engine checksums, reduced-motion behavior and interruption-safe transitions remain release gates.
