import type { Metadata } from 'next';
import Link from 'next/link';
import { PuzzleWave } from '../../components/puzzle-wave';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Puzzle Wave · Motion Lab',
  description: 'Seven original SVG puzzle pieces. One jump at a time, one color at a time.',
};

/** Next.js route only. The portable component has no Next.js dependencies. */
export default function PuzzleWavePage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}><Link href="/">motion<span>lab</span> ↗</Link><span>EXPERIMENT 02 / PUZZLE WAVE</span></nav>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>A LITTLE MOTION. A LITTLE COLOR.</span>
        <h1>Piece by piece.</h1>
        <p>Watch them jump. Give the next one a little color.<br />Seven small steps to something complete.</p>
      </header>
      <PuzzleWave storageKey="motion-lab:puzzle-wave:v1" />
      <div className={styles.notes}>
        <p><strong>One press, one piece.</strong> The wave travels from left to right. The next white piece receives its pastel color as it jumps.</p>
        <p><strong>A jump, then stillness.</strong> Every piece returns to exactly where it started. Replay the wave whenever you like.</p>
      </div>
      <footer className={styles.footer}><span>YOUR SVG ARTWORK · ANIMATED WITH GSAP</span><Link href="/">Back to the SVG quest ↗</Link></footer>
    </main>
  );
}
