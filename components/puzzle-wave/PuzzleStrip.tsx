import { useId } from 'react';
import type { RefCallback } from 'react';
import { PUZZLE_ASSETS } from './puzzle-assets';
import { PASTEL_COLORS } from './puzzle-state';
import { PuzzlePiece } from './PuzzlePiece';
import styles from './puzzle-wave.module.css';

interface PuzzleStripProps {
  colored: readonly number[];
  registerMotion: (index: number) => RefCallback<SVGGElement>;
  registerFill: (index: number) => RefCallback<SVGPathElement>;
}

/** A single shared viewBox prevents spacing gaps between separate SVG images. */
export function PuzzleStrip({ colored, registerMotion, registerFill }: PuzzleStripProps) {
  const id = useId();
  return (
    <svg className={styles.strip} viewBox="-16 -62 763 225" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{`Seven connected puzzle pieces. ${colored.length} of 7 colored.`}</title>
      {PUZZLE_ASSETS.map((asset, index) => (
        <PuzzlePiece key={asset.id} asset={asset} maskPrefix={id}
          color={colored.includes(asset.id) ? PASTEL_COLORS[index] : '#FFFFFF'}
          motionRef={registerMotion(index)} fillRef={registerFill(index)} />
      ))}
    </svg>
  );
}
