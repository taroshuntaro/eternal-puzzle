import { describe, it, expect } from 'vitest';
import {
  ROWS, COLS, placedCells, inBounds, occupancy, isLegal, isSolved,
  type Placement, type Placements,
} from './board';

const iAtOrigin: Placement = { pieceId: 'I', orientation: 0, anchor: { r: 0, c: 0 } };

describe('board', () => {
  it('has a 6x10 board', () => {
    expect(ROWS).toBe(6);
    expect(COLS).toBe(10);
  });

  it('translates a placement into absolute cells', () => {
    const cells = placedCells({ pieceId: 'I', orientation: 0, anchor: { r: 1, c: 2 } });
    expect(cells).toHaveLength(5);
    expect(cells.every((c) => c.c === 2)).toBe(true);
  });

  it('detects out-of-bounds placements', () => {
    expect(inBounds(placedCells({ pieceId: 'I', orientation: 0, anchor: { r: 3, c: 0 } }))).toBe(false);
    expect(inBounds(placedCells(iAtOrigin))).toBe(true);
  });

  it('marks occupied cells with the piece id', () => {
    const grid = occupancy({ I: iAtOrigin });
    expect(grid[0]).toBe('I');
    expect(grid[COLS]).toBe('I'); // (r1,c0)
    expect(grid[1]).toBeNull();
  });

  it('rejects overlapping placements', () => {
    const placements: Placements = { I: iAtOrigin };
    const overlap: Placement = { pieceId: 'L', orientation: 0, anchor: { r: 0, c: 0 } };
    expect(isLegal(placements, overlap)).toBe(false);
  });

  it('allows a non-overlapping in-bounds placement', () => {
    const placements: Placements = { I: iAtOrigin };
    const ok: Placement = { pieceId: 'L', orientation: 0, anchor: { r: 0, c: 5 } };
    expect(isLegal(placements, ok)).toBe(true);
  });

  it('ignores the candidate own previous placement', () => {
    const placements: Placements = { I: iAtOrigin };
    // 同じIを重複する位置へ動かす: 自分自身のセルと重なっても衝突しない
    const moved: Placement = { pieceId: 'I', orientation: 0, anchor: { r: 1, c: 0 } };
    expect(isLegal(placements, moved)).toBe(true);
  });

  it('is not solved when the board is not full', () => {
    expect(isSolved({ I: iAtOrigin })).toBe(false);
  });
});
