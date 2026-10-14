# Visual components

The rendering modules in `src/visuals/` are integrated through React components and typed declarations. Their lifecycle is controlled by React, while each engine manages its own decorative canvas or SVG subtree.

| Module     | Placement                                    |
| ---------- | -------------------------------------------- |
| `flow/`    | Search-area turquoise field                  |
| `dots/`    | Search, cards, API and contact decoration    |
| `globe/`   | Data-section globe                           |
| `shapes/`  | Contour motifs                               |
| `waves/`   | Lower-page atmosphere                        |
| `api/`     | API walkthrough embedded as a custom element |
| `product/` | Five product-interface demonstrations        |

## Integration contract

Rendering components mount near the viewport, pause when appropriate and dispose listeners, observers and controller instances on unmount. Reduced-motion preferences must remain supported. The underlying engines do not manage navigation, forms or page content.

Six original JavaScript rendering/data files are checked against `src/visuals/engine-integrity.json` by `scripts/verify-visuals.mjs`. These files are deliberately not converted to TypeScript in order to preserve verified behavior. Adjustments belong in the typed React wrappers and themed adapter modules. If an original engine must change, update the integrity manifest only after a deliberate review and runtime test.

A GSAP notice is retained in `src/visuals/api/GSAP-NOTICE.txt`. Dependencies and notices must accompany the final source distribution.
