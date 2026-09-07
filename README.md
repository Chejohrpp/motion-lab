# Motion Lab: SVG Quest

This Next.js project is now a small interactive game-like page for learning how GSAP fits into a real web experience.

Run it with:

```sh
pnpm install
pnpm dev
```

Then open http://localhost:3000.

The page has a three-step local quest:

1. Wake a custom inline SVG lantern with a GSAP timeline.
2. Choose a route. React stores the choice and GSAP draws the path.
3. Collect three SVG shards. GSAP provides the click feedback while React updates the count.

Progress is stored under `motion-lab-quest` in the browser's localStorage. The Reset campaign button clears that save. The “Show code” panel displays the small animation recipe for the current objective.

The architecture is deliberate:

```text
user input → GSAP visual feedback → React game state → localStorage save
```

GSAP is the motion layer. It changes SVG transforms, opacity, scale, and stroke drawing over time. React is the state layer. It decides which quests are complete, which path is selected, and how much XP to display. For a production game, keep those responsibilities separate and clean up GSAP contexts when a scene is removed.

GSAP's official repository currently states that the complete toolset is free for commercial use, including the formerly paid plugins. Read the [standard license](https://gsap.com/standard-license) for the exact terms that apply to your distribution model. This project uses the public `gsap` npm package.

## Where to look

- `app/page.tsx` contains the quest state, local save, inline SVG, and GSAP timelines.
- `app/globals.css` contains the responsive game UI.

`pnpm lint` and `node node_modules/typescript/bin/tsc --noEmit` should pass. Test animation performance on the devices that matter to your real project; this page is a learning prototype, not a production benchmark.
