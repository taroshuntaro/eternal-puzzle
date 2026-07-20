import { useEffect } from 'react';
import { useGame } from '../state/GameContext';
import { toPlacements } from '../state/gameReducer';
import { occupancy, COLS } from '../puzzle/board';
import { getPiece } from '../puzzle/pieces';

export function Board({
  cellSize, boardRef, onCellPointerDown,
}: {
  cellSize: number;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onCellPointerDown?: (r: number, c: number, e: React.PointerEvent) => void;
}) {
  const { state, dispatch } = useGame();
  const grid = occupancy(toPlacements(state));

  // キーボード: R=回転, F=反転
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') dispatch({ type: 'rotate' });
      if (e.key === 'f' || e.key === 'F') dispatch({ type: 'flip' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <div
      ref={boardRef}
      className="board"
      style={{ gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)` }}
    >
      {grid.map((pieceId, i) => {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        return (
          <div
            key={i}
            className="cell"
            data-testid="board-cell"
            data-piece={pieceId ?? ''}
            onPointerDown={(e) => onCellPointerDown?.(r, c, e)}
            style={{
              width: cellSize,
              height: cellSize,
              background: pieceId ? getPiece(pieceId).color : 'transparent',
            }}
          />
        );
      })}
    </div>
  );
}
