# Make long target vocabulary previews readable

Written against: `162c35e`

## Evidence chain

- Surface: `/student/explore`, topic card target vocabulary preview.
- Problem: The user-provided screenshot shows target words and Vietnamese meanings rendered as wrapping inline pills. A long meaning makes its pill much taller than neighboring entries and vertically centers the word beside a multi-line explanation, producing uneven rows.
- Design evidence: The screenshot supplied with the request; the live render is owned by `src/pages/student/Explore.jsx` and styled by `src/pages/student/Explore.css`. The page already uses surface, outline, and text color variables for this card.
- Owner: `src/pages/student/Explore.css`, selectors `.topic-card__words`, `.topic-card__chips`, `.topic-card__word-chip`, and `.topic-card__word-meaning`.
- Scope and affected surfaces: Target vocabulary previews on `/student/explore`, including completed topics and next-round topics that use the same card renderer.
- Uncertainty: None for the layout change. Verify long unbroken strings in the rendered browser view.

## Design decision

Render each target as a full-width, aligned vocabulary row with the English word in a compact first column and its meaning in a flexible second column. Align both columns to the top, allow the meaning to wrap within its column, and preserve its complete text. Keep the existing topic-card surface, border, and text color variables.

## Reuse

- Reuse `--color-surface`, `--color-outline-variant`, `--color-on-surface`, and `--color-outline` already used by `.topic-card__words` and its entries.
- Exemplar: Existing `.topic-card__words` container in `src/pages/student/Explore.css`.

## Changes

1. `src/pages/student/Explore.css`
   - Change: Make `.topic-card__chips` a vertical list of rows. Make each `.topic-card__word-chip` fill the available width and use a two-column CSS grid: an intrinsic word column and a `minmax(0, 1fr)` meaning column. Align content to the start; add `min-width: 0`, normal line wrapping, and a readable line height to the meaning. Keep the existing type sizes, colors, and border treatment.
   - Preserve: Word and meaning content, target count, card colors, search behavior, and the set of topic words. Do not clamp or hide long meanings.
   - Verify: Short meanings remain compact; long meanings wrap only inside their own meaning column; every word begins at the same horizontal position; long unbroken text does not overflow the card.

## Scope

- Inherit: All cards rendered by the Explore page, including completed and new-round variants.
- Verify: The card grid at wide, tablet, and narrow mobile widths.
- Exclude: Topic descriptions, card actions, vocabulary content, translations, and other pages.

## Validation

- Product: Open `/student/explore` and compare cards containing short and long target meanings.
- Interface: Verify mixed short/long rows, long Vietnamese phrases, long unbroken text, and narrow viewport wrapping; ensure the button remains below the preview and the card has no horizontal overflow.
- System: Reuse the current Explore CSS variables and the existing `.topic-card__words` surface; do not add a new design token or shared component.
- Repository: `npm run build` → expected successful production build.

## Stop conditions

- Stop if the target word and meaning need to be independently interactive; that would require a product interaction decision beyond this visual restyle.

## Design documentation

- After acceptance and validation: None; keep this local layout decision in the Explore page stylesheet.
