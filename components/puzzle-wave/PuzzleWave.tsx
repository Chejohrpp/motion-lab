'use client';

import { PuzzleStrip } from './PuzzleStrip';
import { PuzzleControls } from './PuzzleControls';
import { usePuzzleWave } from './usePuzzleWave';
import type { PuzzleWaveOptions } from './usePuzzleWave';
import { PASTEL_COLORS } from './puzzle-state';
import styles from './puzzle-wave.module.css';

/** Public orchestrator: compose the artwork, lifecycle hook and controls here. */
export function PuzzleWave(props: PuzzleWaveOptions) {
  const wave = usePuzzleWave(props);
  return (
    <section className={styles.widget} aria-label="Color the puzzle" aria-busy={wave.busy}>
      <div className={styles.widgetHeader}>
        <span>SEVEN PIECES, ONE LITTLE RITUAL</span>
        <span>{wave.colored.length} / 7 colored</span>
      </div>
      <div className={styles.stage}>
        <PuzzleStrip colored={wave.colored} registerMotion={wave.registerMotion} registerFill={wave.registerFill} />
      </div>
      <ol className={styles.progress} aria-label="Piece progress">
        {PASTEL_COLORS.map((color, index) => (
          <li key={color} aria-label={`Piece ${index + 1}: ${wave.colored.includes(index + 1) ? 'colored' : 'uncolored'}`}
            style={{ background: wave.colored.includes(index + 1) ? color : undefined }}>
            {index + 1}
          </li>
        ))}
      </ol>
      <PuzzleControls ready={wave.ready} busy={wave.busy} nextId={wave.nextId}
        onColor={wave.colorNext} onReplay={wave.replay} onReset={wave.reset} />
      <p className={styles.status} role="status" aria-live="polite">{wave.status}</p>
      <p className={styles.save}>{props.storageKey ? wave.saved ? 'Progress saved in this browser' : 'Progress is kept in this session' : 'Progress is kept in this session'}</p>
    </section>
  );
}
