import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { PIECE_IDS, type PieceId } from './puzzle/pieces';
import { initialState, type GameState } from './state/gameReducer';
import { saveProgress, loadCollection } from './storage/collection';

// 実モジュールの isSolved で検証済みの確定解: [orientation, anchor.r, anchor.c]
const SOLUTION: Record<PieceId, [number, number, number]> = {
  F: [3, 0, 0], I: [1, 0, 1], L: [3, 0, 3], N: [5, 2, 1], P: [5, 4, 7], T: [2, 3, 3],
  U: [2, 2, 5], V: [2, 0, 7], W: [3, 3, 1], X: [0, 3, 5], Y: [2, 2, 0], Z: [0, 1, 7],
};

function solvedState(): GameState {
  const s = initialState();
  for (const id of PIECE_IDS) {
    const [o, r, c] = SOLUTION[id];
    s.pieces[id] = { orientation: o, position: { kind: 'board', anchor: { r, c } } };
  }
  return s;
}

beforeEach(() => localStorage.clear());

describe('App solved flow (integration)', () => {
  it('shows the solved dialog and records the solution when a solved board is restored', () => {
    saveProgress(solvedState());
    render(<App />);
    const dialog = screen.getByRole('dialog', { name: '完成' });
    expect(dialog.textContent).toContain('新発見！');
    expect(dialog.textContent).toContain('2339通り中 1通り発見');
    expect(loadCollection()).toHaveLength(1);
  });
});
