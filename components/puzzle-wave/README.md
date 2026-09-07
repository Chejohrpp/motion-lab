# Puzzle Wave

A portable React + TypeScript component using your original seven SVGs and GSAP. The Next.js demo is at `/puzzle-wave`; the existing `/` page is untouched.

## Use it

```tsx
import { PuzzleWave } from './components/puzzle-wave';

// No persistence: all white on each mount.
<PuzzleWave />

// Optional local progress; use a different key for each independent puzzle.
<PuzzleWave storageKey="my-game:puzzle:v1" />

// First missing piece is 5, even though piece 6 already has color.
<PuzzleWave initialColoredPieces={[1, 2, 3, 4, 6]} />
```

Copy this entire `puzzle-wave` folder into another React project with `react`, `react-dom` and `gsap` installed. The project needs TypeScript and CSS Module support (Next.js and Vite support both). No Next.js APIs, account, plugin, fetch, or SVG loader are used by the component. The generated asset data travels with it. The original public SVGs are only required if you regenerate the data.

`initialColoredPieces` is read on mount; IDs are 1–7. A valid save takes precedence. To load a different initial puzzle after mounting, give the component a different React `key`. Storage errors fall back to in-memory progress. Saving is browser/origin specific, with no server sync.

## Files and responsibilities

| File | Responsibility |
| --- | --- |
| `PuzzleWave.tsx` | Public orchestrator; composes artwork, controls, progress and status. |
| `PuzzleStrip.tsx` | One responsive SVG and shared coordinate system for the assembled row. |
| `PuzzlePiece.tsx` | One original piece: fill, inside outline mask, fixed assembly position, movable inner group. |
| `PuzzleControls.tsx` | Accessible buttons and disabled states. |
| `usePuzzleWave.ts` | State, save/load, synchronous interaction lock, opening wave, timeline lifetime and cleanup. |
| `puzzle-timeline.ts` | GSAP sequencing and jump/color timing. This is where to adjust the motion. |
| `puzzle-state.ts` | Pure helpers to find the next uncolored piece; pastel palette. |
| `puzzle-assets.ts` | Generated, exact path data from the provided individual SVG files. |
| `puzzle-wave.module.css` | Scoped component styling, independent of the existing app CSS. |
| `index.ts` | Public exports. |
| `scripts/extract-assets.mjs` | Regenerates path data from the trusted local SVG files. |
| `tests/puzzle-state.test.mjs` | Progress edge cases and source/assembly geometry verification. |

The separate `app/puzzle-wave/page.tsx` is a thin Next.js route; its `page.module.css` styles only that demo page.

## Animation sequence

1. Mount: restore optional progress, then play one wave without adding color.
2. Press **Color piece N**: lock inputs and find the first missing piece ID.
3. Each piece starts `index × 0.18 seconds` into the timeline. It rises 44 SVG units over 0.3 seconds, then returns over 0.3 seconds. A wave lasts 1.68 seconds.
4. Only the target's fill tween starts at that target's own jump time, blending to its pastel over 0.27 seconds. For piece 5 this is 0.72 seconds after the wave starts, never at button press.
5. When that fill finishes, commit its ID to React and optional storage. After piece 7 lands, unlock the controls.

There is no bounce easing, overshoot, rotation, repeat, or idle animation. Previously colored pieces jump without changing color. **Replay wave** adds no color. **Start over** clears the component's progress, restores white fills, and plays the uncolored opening wave. After all seven colors, the color button is disabled and replay remains available.

With `prefers-reduced-motion`, vertical displacement is omitted, while the ordered color timing remains. The timeline pauses while the document is hidden and is killed on unmount. React updates at state transitions, never each animation frame. Only seven inner SVG group transforms and at most one fill are animated; performance should still be checked on target devices.

## Reading the artwork

Your exports contain white fill paths and black outline paths with inside masks. Both are preserved. The individual canvas widths include tabs and padding, so putting seven `<img>` elements side by side would not interlock correctly. `puzzle-assets.ts` applies assembly X offsets `[0, 87, 200, 287, 387, 500, 600]`, matching `complete_puzzle_elements.svg`. An inner group jumps independently of its fixed outer position. `useId()` prevents mask ID collisions when multiple puzzles appear on one page.

Regenerate after changing the SVGs (run from the project root):

```sh
node components/puzzle-wave/scripts/extract-assets.mjs
node --test --test-isolation=none components/puzzle-wave/tests/puzzle-state.test.mjs
```

The tests use Node 24's native TypeScript stripping; use a TypeScript test runner if your destination project runs an older Node version.

Validation: lint, TypeScript and four automated tests pass. Browser checks covered all seven color steps, piece 5 remaining white during the earlier jumps, exact final transforms, replay without new colors, persistence across refresh, and reset restoring all white fills. A browser check also caught and resolved an SVG title hydration mismatch. The current project's previously observed native production-build issue was not re-tested by this isolated feature change.

Implementation references: [GSAP timeline positions](https://gsap.com/docs/v3/GSAP/Timeline/) and [React custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks).
