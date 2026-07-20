import { type PieceId } from './pieces';
import { ROWS, COLS, occupancy, type Placements } from './board';

export type SolutionGrid = PieceId[]; // 長さ ROWS*COLS, 行優先, nullなし

export const TOTAL_SOLUTIONS = 2339;

export function toSolutionGrid(placements: Placements): SolutionGrid {
  const grid = occupancy(placements);
  if (grid.some((cell) => cell === null)) {
    throw new Error('board is not full');
  }
  return grid as PieceId[];
}

function serialize(grid: SolutionGrid): string {
  return grid.join(''); // PieceIdは1文字なので連結で一意
}

function rotate180(grid: SolutionGrid): SolutionGrid {
  return [...grid].reverse();
}

function mirrorH(grid: SolutionGrid): SolutionGrid {
  const out: PieceId[] = new Array(ROWS * COLS);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      out[r * COLS + c] = grid[r * COLS + (COLS - 1 - c)];
  return out;
}

function mirrorV(grid: SolutionGrid): SolutionGrid {
  const out: PieceId[] = new Array(ROWS * COLS);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      out[r * COLS + c] = grid[(ROWS - 1 - r) * COLS + c];
  return out;
}

export function canonicalKey(grid: SolutionGrid): string {
  const variants = [grid, rotate180(grid), mirrorH(grid), mirrorV(grid)];
  return variants.map(serialize).sort()[0];
}
