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

All rendering and product-demo modules are written in TypeScript. The six original Canvas/SVG rendering and data implementations and the three themed engines used by the React adapters are checksum-verified by `scripts/verify-visuals.ts` against `src/visuals/engine-integrity.json`. Any changes to these engines require an explicit review, updated checksums and a visual regression test; TypeScript types alone do not establish rendering equivalence.

A GSAP notice is retained in `src/visuals/api/GSAP-NOTICE.txt`. Dependencies and notices must accompany the final source distribution.
