# Shared site grid

Every page uses the same outer rails. Header, footer, content sections and closing actions derive their width from `.container`; reading columns and embedded product screens may be narrower inside it.

## Horizontal geometry

`--layout-max` is 1440 px. The container width is `calc(100% - 2 * var(--gutter))`, centered with automatic inline margins. Standard desktop gutters are 32–40 px; wide screens use 48–80 px. Mobile gutters are 24 px, then 20 px at 375 px and 16 px at 340 px.

`--layout-gap` is `clamp(24px, 2.5vw, 40px)`. `--layout-half` defines equal halves; `--layout-aside` defines the shared one-third/two-thirds structure. Do not introduce an independent page max-width or a competing structural column gap.

- Section headings and their introductions read top to bottom on the same left edge.
- Three prose columns become one ordered group below 1001 px, avoiding a stranded third card.
- Long legal prose keeps its narrower reading measure inside the page grid.
- Closing CTA groups and footer metadata attach their visible content to the **right outer edge**, not the center rail.
- At 768 px and above, footer metadata stays on one line; smaller screens wrap naturally while preserving alignment.
- Internal insets belong to the comparison/card itself and do not redefine page rails.

## Vertical rhythm and heroes

Use the spacing scale in [Styles](STYLES.md). `--section-space` and density inputs control homepage spacing; inner editorial sections use a consistent responsive vertical rhythm. One page surface and whitespace separate content; quiet dividers remain inside the common rails.

Non-legal internal heroes share the same minimum-height, padding and artwork geometry. Pricing uses a compact introduction to bring the plan prices into the first desktop viewport; it retains the shared rails, title role and artwork. All six legal documents share reserved heading/description/date/navigation starts, including Cookie Preferences. These are **minimum sizes**: enlarged text must expand the page rather than clip.

Heading and body measures come from `type-scale.css`; do not patch one page with a smaller heading merely to fit the common first screen. If content changes, test the complete family at narrow widths and with enlarged text.

## Responsive ownership

The site combines three distinct mechanisms. They should not be substituted for one another:

- **Viewport media queries** coordinate the header/mobile navigation, billing dock, outer page rails, global composition changes, reduced-motion behavior and short-desktop density. These behaviors intentionally follow the browser window.
- **Container queries** coordinate the layout inside independently sized sections and product fragments. Search Preview, Research, Audience, Data, API and Product Evidence already use container sizing. Data Lens, Query Fragment and Monitoring Assets adapt to their own inline size as well; a narrow panel in a wide window must remain readable.
- **Intrinsic layout** uses Grid and Flexbox with `minmax(0, 1fr)`, `min-width: 0`, logical sizing, `clamp()` and natural height. Text wrapping and increased font scale must expand content instead of clipping it.

Apply `container-type: inline-size` to the component boundary, not arbitrary ancestors. A container query matches **descendants**, not its own container element. Keep the container small enough to belong to one component, and confirm that inline-size containment does not suppress a needed intrinsic width. Use `cqi`/`cqw` only with a deliberate containing block. Do not replace structural page breakpoints with arbitrary container widths just to reduce the number of media queries.

The 1200 px shell/navigation contract is viewport-driven. Primary content uses the existing 1440 px maximum container and shared gutters; section-specific container thresholds express the space needed by their actual contents. Animated scenes measure their real host element, adjust rendering quality for constrained devices, and respect reduced motion. Decorative canvases preserve their composition; product/API interfaces must keep their meaningful text readable through reflow or a clearly associated summary rather than whole-panel text shrinkage.

When changing responsive CSS, verify 320, 375, 390, 599/600, 767/768, 899/900, 1199/1200, 1440 and 1920 px, including short desktop heights. Test Light/Dark, mobile touch, keyboard focus, enlarged text, zoom, and nested narrow components on a **wide** viewport. Observe both horizontal overflow and content loss; hiding technical facts is not a valid workaround for a narrow component.

## Regression coverage

- `column-rails`, `site-grid`, `reading-rails`: outer edges and structural columns.
- `inner-hero-layout`: 12 widths from 320 to 1920 px, shared next-section starts, the compact Pricing introduction and enlarged text.
- `style-contract`: six legal pages at nine widths, grey active Sign In.
- `visual-rhythm`, `editorial-readability`: reading groups, spacing, title relationships and responsive images.
- `design-system`: typography and shared controls are independent of lazy CSS navigation order.

Use this guide with the token owners and regression tests when changing layout.
