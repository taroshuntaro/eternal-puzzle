import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GameProvider, useGame } from './GameContext';
import { gameReducer, initialState } from './gameReducer';
import { saveProgress } from '../storage/collection';
import { PIECE_IDS } from '../puzzle/pieces';

beforeEach(() => localStorage.clear());

function Probe() {
  const { state, dispatch } = useGame();
  return (
    <button onClick={() => dispatch({ type: 'select', id: 'F' })}>
      selected:{state.selected ?? 'none'}
    </button>
  );
}

function PieceProbe() {
  const { state } = useGame();
  // pieces が壊れていればこの参照で throw する（復帰の健全性を検証）
  return <span>F:{state.pieces.F.position.kind} count:{Object.keys(state.pieces).length}</span>;
}

function BoardCountProbe() {
  const { state } = useGame();
  const onBoard = PIECE_IDS.filter((id) => state.pieces[id].position.kind === 'board').length;
  return <span>onBoard:{onBoard}</span>;
}

describe('GameProvider', () => {
  it('provides state and dispatch to children', () => {
    render(
      <GameProvider>
        <Probe />
      </GameProvider>,
    );
    const btn = screen.getByRole('button');
    expect(btn.textContent).toBe('selected:none');
    act(() => btn.click());
    expect(btn.textContent).toBe('selected:F');
  });

  it('persists selection to localStorage', () => {
    render(
      <GameProvider>
        <Probe />
      </GameProvider>,
    );
    act(() => screen.getByRole('button').click());
    expect(localStorage.getItem('eternal-puzzle:pentomino:progress')).toContain('"selected":"F"');
  });

  it('restores a valid saved game state on mount', () => {
    const seeded = gameReducer(initialState(), { type: 'place', id: 'F', anchor: { r: 0, c: 0 } });
    saveProgress(seeded);
    render(<GameProvider><PieceProbe /></GameProvider>);
    expect(screen.getByText(/F:board/)).toBeTruthy();
  });

  it('falls back to initial state (no crash) when saved state is malformed', () => {
    localStorage.setItem('eternal-puzzle:pentomino:progress', JSON.stringify({ pieces: {} }));
    expect(() => render(<GameProvider><PieceProbe /></GameProvider>)).not.toThrow();
    expect(screen.getByText(/count:12/)).toBeTruthy();
  });

  it('falls back to initial state when the restored board is illegal (overlap)', () => {
    const s = initialState();
    // 構造は妥当だが I と L が同じ位置で重なっている不正な盤
    s.pieces.I = { orientation: 0, position: { kind: 'board', anchor: { r: 0, c: 0 } } };
    s.pieces.L = { orientation: 0, position: { kind: 'board', anchor: { r: 0, c: 0 } } };
    saveProgress(s);
    render(<GameProvider><BoardCountProbe /></GameProvider>);
    expect(screen.getByText('onBoard:0')).toBeTruthy();
  });

  it('falls back to initial state (no crash) when a saved orientation is out of range', () => {
    const s = initialState();
    // 向きインデックスが実在しない範囲外の値。placedCells が落ちる前に弾かれるべき。
    s.pieces.F = { orientation: 50, position: { kind: 'board', anchor: { r: 0, c: 0 } } };
    saveProgress(s);
    expect(() => render(<GameProvider><PieceProbe /></GameProvider>)).not.toThrow();
    expect(screen.getByText(/count:12/)).toBeTruthy();
  });
});
