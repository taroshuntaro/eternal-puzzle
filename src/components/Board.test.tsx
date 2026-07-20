import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useRef } from 'react';
import { GameProvider, useGame } from '../state/GameContext';
import { Board } from './Board';

beforeEach(() => localStorage.clear());

function Harness() {
  const ref = useRef<HTMLDivElement>(null);
  const { dispatch } = useGame();
  return (
    <>
      <button onClick={() => dispatch({ type: 'place', id: 'I', anchor: { r: 0, c: 0 } })}>
        place-I
      </button>
      <Board cellSize={30} boardRef={ref} />
    </>
  );
}

describe('Board', () => {
  it('renders 60 cells', () => {
    const ref = { current: null };
    render(
      <GameProvider>
        <Board cellSize={30} boardRef={ref as any} />
      </GameProvider>,
    );
    expect(screen.getAllByTestId('board-cell')).toHaveLength(60);
  });

  it('paints occupied cells after a placement', () => {
    render(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );
    act(() => screen.getByText('place-I').click());
    const painted = screen
      .getAllByTestId('board-cell')
      .filter((el) => el.getAttribute('data-piece') === 'I');
    expect(painted).toHaveLength(5);
  });
});
