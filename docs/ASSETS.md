# Assets and licenses

Static assets live in `public/assets/`; fonts and notices live in `public/fonts/`. URLs must include Vite's base. All URLs resolve through `src/content/assets.ts`. `src/content/asset-manifest.ts` is the shared inventory used by the browser resolver and asset verifier.

| Folder                          | Content and variants                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `assets/brand/`                 | Logo and favicon                                                                              |
| `assets/application/`           | Fourteen exact SVG exports from the approved application Figma page; see APPLICATION-DEMOS.md |
| `assets/inner/`                 | Hero illustrations with matching light and `-dark.webp` editions                              |
| `assets/use-cases/`             | Three families reused on homepage cards and relevant page heroes, light/dark                  |
| `assets/editorial/`             | Three editorial families: light, `-600`, `-dark`, `-dark-600`                                 |
| `assets/illustrations/closing/` | Responsive closing artwork with light/dark editions                                           |
| `fonts/`                        | Local Instrument Sans, Onest and IBM Plex Mono WOFF2 files and their notices                  |

The `Logo` component preserves the original vector paths from `assets/brand/logo.svg`, including the custom wordmark. Never replace the wordmark with typeset text or apply capitalization requests to its geometry. Uppercase shell text labels are separate from the logo; theme colors remain controlled by existing tokens.

`ThemedArtwork` selects the resolved application theme, including manual override of the system theme. Preserve intrinsic width/height and aspect ratio. Responsive editorial variants are declared in the manifest; the component automatically supplies their 600/1200 px `srcSet`. Authors still provide an accurate `sizes` attribute. Never use inversion or recoloring filters to manufacture dark art. Register paired assets once in `src/content/asset-manifest.ts`. Its keys also define the TypeScript `ThemedAsset` union, so misspelled artwork references fail compilation. The verifier derives the expected light/dark and responsive filenames from the same record.

The application assets preserve the exported vector geometry. Two small toolbar icons use their original SVG files as CSS masks so their color follows the active theme; artwork and flags are rendered without recoloring filters. [Application demonstrations](APPLICATION-DEMOS.md) records the source node IDs, dimensions and placements. Screenshots of the design are review references, not rendered interface assets.

`npm run verify:assets` checks every registered image/logo and required font/license file, including expected variants and SVG safety checks. Browser tests additionally check actual image and mask decoding, responsive selection, theme changes and the API icons' rendered dimensions. Only approved, optimized assets and their required licenses belong in the source tree. Keep design working files and comparison exports outside the repository.

Preserve `public/fonts/LICENSE-Instrument-Sans.txt`, `public/fonts/LICENSE-IBM-Plex-Mono.txt` and `public/fonts/LICENSE-Onest.txt`. Product artwork and publication usage rights require owner confirmation; an asset's presence does not establish a licensing clearance. There is no new blanket open-source license for the site's own artwork or source in this handoff.
