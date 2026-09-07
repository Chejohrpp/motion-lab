/** Pure progress helpers: piece IDs are one-based; timeline indexes are zero-based. */
export const PIECE_COUNT = 7;
export const PASTEL_COLORS = ['#F2B8BE', '#F6C9A0', '#F1E4A6', '#BCDCC4', '#B9DCEB', '#C5C2EA', '#E6C0DF'] as const;

export function normalizeProgress(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= PIECE_COUNT))].sort((a, b) => a - b);
}

export function nextUncoloredPiece(colored: readonly number[]): number | null {
  for (let id = 1; id <= PIECE_COUNT; id++) if (!colored.includes(id)) return id;
  return null;
}

export function colorPiece(colored: readonly number[], id: number): number[] {
  return normalizeProgress([...colored, id]);
}
