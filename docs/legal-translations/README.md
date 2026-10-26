# Legal translations

The Russian and Traditional Chinese documents are complete reference translations of the six preserved English sources in `docs/legal-sources`. The source documents and their published edition dates are unchanged. Each translation records the SHA-256 hash of the English source it translates.

Run `npm run legal:compile` after reviewing a translation. The compiler verifies the source hash, edition date, heading and paragraph structure, ordered and unordered lists, quoted blocks, emphasis, numeric values and explicit link destinations before producing the locale JSON files. `npm run legal:check` rejects stale generated content. These mechanical checks do not replace a bilingual legal review.

English heading identifiers remain stable in every language, so a language switch preserves the selected clause. Links between documents follow the active language. Only the requested language's document bundle loads, and the page displays the localized edition date. The language selector opens the matching English original and retains the selected clause. The document body has no translation notice.

Commented-out provisions in the English Markdown remain unpublished. No new rights, service terms or commercial plan mappings are inferred by the translations. The document owner should review and approve translations before treating them as contractual editions.
