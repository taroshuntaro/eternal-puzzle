import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GameProvider, useGame } from './GameContext';
import { gameReducer, initialState } from './gameReducer';
import { saveProgress } from '../storage/collection';

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
});
