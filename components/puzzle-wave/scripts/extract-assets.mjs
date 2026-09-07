// Run from the project root: node components/puzzle-wave/scripts/extract-assets.mjs
// Converts trusted local SVG paths to data. No SVG markup is injected at runtime.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = new URL('../../../public/puzzles/', import.meta.url);
const offsets = [0, 87, 200, 287, 387, 487, 600];
const pieces = await Promise.all(offsets.map(async (x, index) => {
  const filename = `puzzle_element_${index + 1}.svg`;
  const svg = await readFile(new URL(filename, source), 'utf8');
  const paths = [...svg.matchAll(/<path\b([^>]+)\/>/g)].map(([, attrs]) => ({
    d: attrs.match(/\bd="([^"]+)"/)?.[1],
    fill: attrs.match(/\bfill="([^"]+)"/)?.[1],
  }));
  const shape = paths.find(p => p.fill === 'white')?.d;
  const outline = paths.find(p => p.fill === 'black')?.d;
  if (!shape || !outline) throw new Error(`Missing shape or outline in ${filename}`);
  return { id: index + 1, source: filename, x, shape, outline };
}));
const target = new URL('../puzzle-assets.ts', import.meta.url);
await writeFile(target, '// Generated from public/puzzles/*.svg. Regenerate with scripts/extract-assets.mjs.\nexport const PUZZLE_ASSETS = ' + JSON.stringify(pieces, null, 2) + ' as const;\n');
console.log(`Extracted ${pieces.length} original SVG pieces to ${fileURLToPath(target)}`);
