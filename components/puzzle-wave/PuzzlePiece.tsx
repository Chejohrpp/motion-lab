import type { RefCallback } from 'react';
import type { PUZZLE_ASSETS } from './puzzle-assets';

interface PuzzlePieceProps {
  asset: (typeof PUZZLE_ASSETS)[number];
  color: string;
  maskPrefix: string;
  motionRef: RefCallback<SVGGElement>;
  fillRef: RefCallback<SVGPathElement>;
}

/** Original fill, mask and outline, translated into the reference assembly. */
export function PuzzlePiece({ asset, color, maskPrefix, motionRef, fillRef }: PuzzlePieceProps) {
  const maskId = `${maskPrefix}-piece-${asset.id}`;
  return (
    <g transform={`translate(${asset.x} 0)`}>
      <g ref={motionRef} data-piece={asset.id} transform="translate(0 0)">
        <mask id={maskId} fill="white">
          <path d={asset.shape} fillRule="evenodd" />
        </mask>
        <path ref={fillRef} data-piece-fill={asset.id} d={asset.shape} fill={color} fillRule="evenodd" />
        <path d={asset.outline} fill="black" mask={`url(#${maskId})`} />
      </g>
    </g>
  );
}
