import { describe, it, expect } from 'vitest';
import { ROWS, COLS } from './board';
import { canonicalKey, TOTAL_SOLUTIONS, type SolutionGrid } from './solution';
import type { PieceId } from './pieces';

// テスト用の擬似解グリッド(実在の解である必要はない。対称変換の不変性のみ検証)
function sampleGrid(): SolutionGrid {
  const ids: PieceId[] = ['F','I','L','N','P','T','U','V','W','X','Y','Z'];
  const grid: PieceId[] = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    grid.push(ids[Math.floor(i / 5) % 12]);
  }
  return grid;
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

describe('solution canonicalization', () => {
  it('exposes the known total solution count', () => {
    expect(TOTAL_SOLUTIONS).toBe(2339);
  });

  it('gives the same key for all four symmetric variants', () => {
    const g = sampleGrid();
    const base = canonicalKey(g);
    expect(canonicalKey(rotate180(g))).toBe(base);
    expect(canonicalKey(mirrorH(g))).toBe(base);
    expect(canonicalKey(mirrorV(g))).toBe(base);
  });

  it('gives different keys for genuinely different solutions', () => {
    const g = sampleGrid();
    const h = [...g];
    // 対称では移り合わない改変(先頭セルだけ別ピースに)を作る
    h[0] = h[0] === 'Z' ? 'F' : 'Z';
    expect(canonicalKey(h)).not.toBe(canonicalKey(g));
  });
});
