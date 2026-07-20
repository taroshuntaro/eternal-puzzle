import { describe, it, expect } from 'vitest';
import { initialState, gameReducer, toPlacements } from './gameReducer';
import { isSolved } from '../puzzle/board';
import { getPiece } from '../puzzle/pieces';

describe('gameReducer', () => {
  it('starts with all pieces in the tray and nothing selected', () => {
    const s = initialState();
    expect(s.selected).toBeNull();
    expect(Object.values(s.pieces).every((p) => p.position.kind === 'tray')).toBe(true);
    expect(toPlacements(s)).toEqual({});
  });

  it('selects a piece', () => {
    const s = gameReducer(initialState(), { type: 'select', id: 'F' });
    expect(s.selected).toBe('F');
  });

  it('rotates the selected piece via rotateMap', () => {
    let s = gameReducer(initialState(), { type: 'select', id: 'F' });
    s = gameReducer(s, { type: 'rotate' });
    expect(s.pieces.F.orientation).toBe(getPiece('F').rotateMap[0]);
  });

  it('places a piece on the board when legal', () => {
    let s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 0, c: 0 } });
    expect(s.pieces.I.position).toEqual({ kind: 'board', anchor: { r: 0, c: 0 } });
    expect(toPlacements(s).I).toBeDefined();
  });

  it('rejects an illegal placement (out of bounds)', () => {
    const s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 5, c: 0 } });
    expect(s.pieces.I.position.kind).toBe('tray');
  });

  it('rejects a rotation that would make a board piece illegal, keeping it legal', () => {
    // Iを右端付近に縦置き -> 横向きに回転すると盤外になるので拒否される
    let s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 0, c: 9 } });
    s = gameReducer(s, { type: 'select', id: 'I' });
    const before = s.pieces.I.orientation;
    s = gameReducer(s, { type: 'rotate' });
    expect(s.pieces.I.orientation).toBe(before); // 変化なし(拒否)
  });

  it('removes a placed piece back to the tray', () => {
    let s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 0, c: 0 } });
    s = gameReducer(s, { type: 'remove', id: 'I' });
    expect(s.pieces.I.position.kind).toBe('tray');
    expect(toPlacements(s)).toEqual({});
  });

  it('resets to the initial state', () => {
    let s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 0, c: 0 } });
    s = gameReducer(s, { type: 'reset' });
    expect(toPlacements(s)).toEqual({});
  });

  it('never reports solved for the empty board', () => {
    expect(isSolved(toPlacements(initialState()))).toBe(false);
  });
});
