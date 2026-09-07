import styles from './puzzle-wave.module.css';

interface PuzzleControlsProps {
  ready: boolean;
  busy: boolean;
  nextId: number | null;
  onColor: () => void;
  onReplay: () => void;
  onReset: () => void;
}

/** Native buttons provide keyboard access and block overlapping waves. */
export function PuzzleControls({ ready, busy, nextId, onColor, onReplay, onReset }: PuzzleControlsProps) {
  return (
    <div className={styles.controls}>
      <button className={styles.primary} disabled={!ready || busy || nextId === null} onClick={onColor}>
        {!ready ? 'Preparing puzzle…' : busy ? 'Wave in progress…' : nextId === null ? 'All pieces colored ✓' : `Color piece ${nextId}`}
      </button>
      <div className={styles.secondary}>
        <button disabled={!ready || busy} onClick={onReplay}>Replay wave</button>
        <span aria-hidden="true">·</span>
        <button disabled={!ready || busy} onClick={onReset}>Start over</button>
      </div>
    </div>
  );
}
