import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorPiece, nextUncoloredPiece, normalizeProgress } from '../puzzle-state.ts';
import { PUZZLE_ASSETS } from '../puzzle-assets.ts';
import { readFileSync } from 'node:fs';

test('skips colored pieces and targets the first gap, including piece 5', () => {
  assert.equal(nextUncoloredPiece([]), 1);
  assert.equal(nextUncoloredPiece([1, 2, 3, 4]), 5);
  assert.equal(nextUncoloredPiece([1, 2, 3, 4, 6, 7]), 5);
  assert.equal(nextUncoloredPiece([1, 2, 3, 4, 5, 6, 7]), null);
});

test('normalizes malformed saved IDs and ignores duplicate color commits', () => {
  assert.deepEqual(normalizeProgress(null), []);
  assert.deepEqual(normalizeProgress([7, 1, 1, 8, -1, 2.5, '3', null]), [1, 7]);
  const before = [1, 2];
  assert.deepEqual(colorPiece(before, 2), [1, 2]);
  assert.deepEqual(colorPiece(before, 3), [1, 2, 3]);
  assert.deepEqual(before, [1, 2]);
});

test('seven presses fill exactly seven unique pieces', () => {
  let colored = [];
  for (let id = 1; id <= 7; id++) {
    const target = nextUncoloredPiece(colored);
    assert.equal(target, id);
    colored = colorPiece(colored, target);
  }
  assert.equal(nextUncoloredPiece(colored), null);
});

test('preserves original SVG paths and aligns them with the complete reference', () => {
  // tests/ lives one level below the component; source files are at the project root.
  const source = new URL('../../../public/puzzles/', import.meta.url);
  const complete = readFileSync(new URL('complete_puzzle_elements.svg', source), 'utf8');
  const reference = [...complete.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\bfill="white"/g)].map(m => m[1]);
  assert.equal(PUZZLE_ASSETS.length, 7);
  assert.equal(reference.length, 7);
  PUZZLE_ASSETS.forEach((piece, index) => {
    const original = readFileSync(new URL(piece.source, source), 'utf8');
    assert.ok(original.includes(`d="${piece.shape}"`));
    assert.ok(original.includes(`d="${piece.outline}"`));
    // Compare all absolute SVG coordinate pairs after assembly translation.
    const tokenize = d => d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
    const a = tokenize(piece.shape), b = tokenize(reference[index]);
    assert.equal(a.length, b.length);
    let command = '', ordinate = 0;
    a.forEach((token, i) => {
      if (/^[A-Za-z]$/.test(token)) { command = token; ordinate = 0; assert.equal(token, b[i]); return; }
      const isX = command === 'H' || (command !== 'V' && ordinate % 2 === 0);
      const actual = Number(token) + (isX ? piece.x : 0);
      assert.ok(Math.abs(actual - Number(b[i])) < 0.003, `Piece ${piece.id} coordinate ${i} differs: ${actual} vs ${b[i]}`);
      ordinate++;
    });
  });
});
