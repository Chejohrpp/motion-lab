import { useCallback, useEffect, useRef, useState } from 'react';
import type { gsap } from 'gsap';
import { createPuzzleTimeline } from './puzzle-timeline';
import { colorPiece, nextUncoloredPiece, normalizeProgress, PIECE_COUNT } from './puzzle-state';

export interface PuzzleWaveOptions {
  /** Optional storage: omit to keep progress only until this component unmounts. */
  storageKey?: string;
  /** One-based IDs; gaps are supported, e.g. [1, 2, 3, 4, 6] targets piece 5. */
  initialColoredPieces?: readonly number[];
}

/** Owns progress and one disposable timeline. No per-frame React renders. */
export function usePuzzleWave({ storageKey, initialColoredPieces = [] }: PuzzleWaveOptions) {
  const [initial] = useState(() => normalizeProgress(initialColoredPieces));
  const [colored, setColored] = useState<number[]>(initial);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState('Preparing the opening wave.');
  const current = useRef(initial);
  const locked = useRef(true);
  const motion = useRef<SVGGElement[]>([]);
  const fills = useRef<SVGPathElement[]>([]);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const persist = useCallback((ids: number[]) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, colored: ids }));
      setSaved(true);
    } catch { setSaved(false); }
  }, [storageKey]);

  const play = useCallback((targetId: number | null) => {
    if (motion.current.filter(Boolean).length !== PIECE_COUNT) return;
    locked.current = true;
    setBusy(true);
    setStatus(targetId ? `Wave started. Piece ${targetId} will receive its color on its jump.` : 'A wave from piece 1 to piece 7.');
    timeline.current?.kill();
    timeline.current = createPuzzleTimeline({
      nodes: { motion: motion.current, fills: fills.current },
      targetId,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onColored: id => {
        current.current = colorPiece(current.current, id);
        setColored(current.current);
        persist(current.current);
      },
      onComplete: () => {
        locked.current = false;
        setBusy(false);
        const next = nextUncoloredPiece(current.current);
        setStatus(next ? `All pieces settled. Piece ${next} is next to color.` : 'All seven pieces are colored. Replay the wave or start over.');
      },
    });
    timeline.current.play(0);
  }, [persist]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let loaded = initial;
      if (storageKey) {
        try {
          const raw = localStorage.getItem(storageKey);
          const data = raw ? JSON.parse(raw) : null;
          if (data?.version === 1) loaded = normalizeProgress(data.colored);
        } catch { /* Corrupt or unavailable storage falls back to initial props. */ }
      }
      current.current = loaded;
      setColored(loaded);
      persist(loaded);
      setReady(true);
      play(null); // Opening wave never colors a new piece.
    });
    const visibility = () => {
      if (document.hidden) timeline.current?.pause();
      else if (locked.current) timeline.current?.resume();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visibility);
      timeline.current?.kill();
      timeline.current = null;
    };
  }, [initial, storageKey, persist, play]);

  function colorNext() {
    if (locked.current) return;
    const target = nextUncoloredPiece(current.current);
    if (target !== null) play(target);
  }
  function replay() { if (!locked.current) play(null); }
  function reset() {
    if (locked.current) return;
    timeline.current?.kill();
    // GSAP owns transient fill styles; clear them before React restores white fills.
    fills.current.forEach(node => node.style.removeProperty('fill'));
    current.current = [];
    setColored([]);
    persist([]);
    play(null);
  }

  return {
    colored, ready, busy, saved, status,
    nextId: nextUncoloredPiece(colored), colorNext, replay, reset,
    registerMotion: (index: number) => (node: SVGGElement | null) => { if (node) motion.current[index] = node; },
    registerFill: (index: number) => (node: SVGPathElement | null) => { if (node) fills.current[index] = node; },
  };
}
