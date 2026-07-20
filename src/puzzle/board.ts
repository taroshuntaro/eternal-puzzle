import { type Cell, type PieceId, getPiece } from './pieces';
export type { Cell } from './pieces';

export const ROWS = 6;
export const COLS = 10;

export type Placement = {
  pieceId: PieceId;
  orientation: number;
  anchor: Cell;
};

export type Placements = Partial<Record<PieceId, Placement>>;

export function placedCells(p: Placement): Cell[] {
  const orientation = getPiece(p.pieceId).orientations[p.orientation];
  return orientation.map((c) => ({ r: c.r + p.anchor.r, c: c.c + p.anchor.c }));
}

export function cellInBounds(c: Cell): boolean {
  return c.r >= 0 && c.r < ROWS && c.c >= 0 && c.c < COLS;
}

export function inBounds(cells: Cell[]): boolean {
  return cells.every(cellInBounds);
}

export function occupancy(placements: Placements): (PieceId | null)[] {
  const grid: (PieceId | null)[] = new Array(ROWS * COLS).fill(null);
  for (const p of Object.values(placements)) {
    if (!p) continue;
    for (const cell of placedCells(p)) {
      if (!cellInBounds(cell)) continue; // 盤外は書き込まない(防御)
      grid[cell.r * COLS + cell.c] = p.pieceId;
    }
  }
  return grid;
}

export function isLegal(placements: Placements, candidate: Placement): boolean {
  const cells = placedCells(candidate);
  if (!inBounds(cells)) return false;
  const others: Placements = { ...placements };
  delete others[candidate.pieceId];
  const grid = occupancy(others);
  return cells.every((c) => grid[c.r * COLS + c.c] === null);
}

export function isSolved(placements: Placements): boolean {
  return occupancy(placements).every((cell) => cell !== null);
}
