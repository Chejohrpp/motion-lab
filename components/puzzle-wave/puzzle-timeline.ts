import { gsap } from 'gsap';
import { PASTEL_COLORS } from './puzzle-state';

export const WAVE_TIMING = { step: 0.09, rise: 0.3, fall: 0.3, height: 44, color: 0.27 } as const;

export interface WaveNodes {
  motion: SVGGElement[];
  fills: SVGPathElement[];
}

/** One jump per piece. Absolute offsets keep fill and motion on the SAME clock. */
export function createPuzzleTimeline({ nodes, targetId, reducedMotion, onColored, onComplete }: {
  nodes: WaveNodes;
  targetId: number | null;
  reducedMotion: boolean;
  onColored: (id: number) => void;
  onComplete: () => void;
}) {
  const timeline = gsap.timeline({ paused: true, onComplete });
  nodes.motion.forEach((node, index) => {
    const start = index * WAVE_TIMING.step;
    timeline.addLabel(`piece-${index + 1}`, start);
    // The outer group owns assembly position. Only this inner group moves.
    timeline.to(node, {
      attr: { transform: `translate(0 ${reducedMotion ? 0 : -WAVE_TIMING.height})` },
      duration: WAVE_TIMING.rise,
      ease: 'power2.out',
    }, start);
    timeline.to(node, {
      attr: { transform: 'translate(0 0)' },
      duration: WAVE_TIMING.fall,
      ease: 'power2.in',
    }, start + WAVE_TIMING.rise);
    if (targetId === index + 1) {
      timeline.to(nodes.fills[index], {
        fill: PASTEL_COLORS[index],
        duration: WAVE_TIMING.color,
        ease: 'sine.inOut',
        // Commit React state and save only after this piece visibly receives its color.
        onComplete: () => onColored(targetId),
      }, start);
    }
  });
  return timeline;
}
