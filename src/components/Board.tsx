import { useEffect } from 'react';
import { useGame } from '../state/GameContext';
import { toPlacements } from '../state/gameReducer';
import { occupancy, COLS } from '../puzzle/board';
import { getPiece } from '../puzzle/pieces';
import { type DropPreview } from '../hooks/usePointerDrag';

export function Board({
  cellSize, boardRef, onCellPointerDown, preview,
}: {
  cellSize: number;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onCellPointerDown?: (r: number, c: number, e: React.PointerEvent) => void;
  preview?: DropPreview;
}) {
  const { state, dispatch } = useGame();
  const grid = occupancy(toPlacements(state));
  const previewCells = new Set((preview?.cells ?? []).map((c) => `${c.r},${c.c}`));

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
        const inPreview = previewCells.has(`${r},${c}`);
        const previewClass = inPreview
          ? preview!.legal ? ' preview-legal' : ' preview-illegal'
          : '';
        return (
          <div
            key={i}
            className={`cell${previewClass}`}
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
