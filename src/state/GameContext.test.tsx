import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GameProvider, useGame } from './GameContext';

beforeEach(() => localStorage.clear());

function Probe() {
  const { state, dispatch } = useGame();
  return (
    <button onClick={() => dispatch({ type: 'select', id: 'F' })}>
      selected:{state.selected ?? 'none'}
    </button>
  );
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
});
