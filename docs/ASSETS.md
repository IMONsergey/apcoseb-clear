# Assets and licenses

Static assets live in `public/assets/`; fonts and notices live in `public/fonts/`. URLs must include Vite's base. All URLs resolve through `src/content/assets.ts`. `src/content/asset-manifest.ts` is the shared inventory used by the browser resolver and asset verifier.

| Folder                              | Content and variants                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `assets/brand/`                     | Logo and favicon                                                                                 |
| `assets/inner/`                     | Nine hero families: original light and separately generated `-dark.webp`                         |
| `assets/use-cases/`                 | Three families reused on homepage cards and relevant page heroes, light/dark                     |
| `assets/editorial/`                 | Three editorial families: light, `-600`, `-dark`, `-dark-600`                                    |
| `assets/illustrations/walkthrough/` | Three static fallback families for the five GSAP product scenes, light/dark and 360/600 variants |
| `assets/illustrations/api/`         | API static fallback; the embedded product interface intentionally remains light                  |
| `assets/illustrations/closing/`     | Responsive closing artwork with light/dark editions                                              |
| `fonts/`                            | Local Instrument Sans and IBM Plex Mono WOFF2 files and their notices                            |

The `Logo` component preserves the original vector paths from `assets/brand/logo.svg`, including the custom wordmark. Never replace the wordmark with typeset text or apply capitalization requests to its geometry. Uppercase shell text labels are separate from the logo; theme colors remain controlled by existing tokens.

`ThemedArtwork` selects the resolved application theme, including manual override of the system theme. Preserve intrinsic width/height and aspect ratio. Responsive editorial variants are declared in the manifest; the component automatically supplies their 600/1200 px `srcSet`. Authors still provide an accurate `sizes` attribute. Never use inversion or recoloring filters to manufacture dark art. Register paired assets once in `src/content/asset-manifest.ts`. Its keys also define the TypeScript `ThemedAsset` union, so misspelled artwork references fail compilation. The verifier derives the expected light/dark and responsive filenames from the same record.

`npm run verify:assets` currently checks 73 image/logo files and five font/license files, including expected variants and SVG safety checks. Browser tests additionally check actual image decoding, responsive selection and theme changes. Only approved, optimized assets and their required licenses belong in the source tree. Keep design working files and comparison exports outside the repository.

Preserve `public/fonts/LICENSE-Instrument-Sans.txt`, `public/fonts/LICENSE-IBM-Plex-Mono.txt`, and `src/visuals/api/GSAP-NOTICE.txt`. Product artwork and publication usage rights require owner confirmation; an asset's presence does not establish a licensing clearance. There is no new blanket open-source license for the site's own artwork or source in this handoff.
