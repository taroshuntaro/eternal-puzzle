import { describe, it, expect } from 'vitest';
import { PIECES, PIECE_IDS, getPiece } from './pieces';

describe('pieces', () => {
  it('has 12 pentominoes', () => {
    expect(PIECES).toHaveLength(12);
    expect(PIECE_IDS).toEqual(['F','I','L','N','P','T','U','V','W','X','Y','Z']);
  });

  it('every orientation has exactly 5 cells', () => {
    for (const p of PIECES) {
      for (const o of p.orientations) {
        expect(o).toHaveLength(5);
      }
    }
  });

  it('has correct number of unique orientations', () => {
    expect(getPiece('X').orientations).toHaveLength(1);
    expect(getPiece('I').orientations).toHaveLength(2);
    expect(getPiece('F').orientations).toHaveLength(8);
    expect(getPiece('T').orientations).toHaveLength(4);
    const total = PIECES.reduce((s, p) => s + p.orientations.length, 0);
    expect(total).toBe(63);
  });

  it('rotateMap maps each orientation to a valid index', () => {
    for (const p of PIECES) {
      expect(p.rotateMap).toHaveLength(p.orientations.length);
      for (const idx of p.rotateMap) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(p.orientations.length);
      }
    }
  });

  it('rotating four times returns to the original orientation', () => {
    for (const p of PIECES) {
      for (let i = 0; i < p.orientations.length; i++) {
        const j = p.rotateMap[p.rotateMap[p.rotateMap[p.rotateMap[i]]]];
        expect(j).toBe(i);
      }
    }
  });

  it('flipping twice returns to the original orientation', () => {
    for (const p of PIECES) {
      for (let i = 0; i < p.orientations.length; i++) {
        expect(p.flipMap[p.flipMap[i]]).toBe(i);
      }
    }
  });
});
