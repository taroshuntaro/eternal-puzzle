import { useEffect, useState } from 'react';
import { type Cell, type PieceId } from '../puzzle/pieces';
import { cellFromPoint, anchorFrom } from '../puzzle/geometry';
import { ROWS, COLS, isLegal } from '../puzzle/board';
import { useGame } from '../state/GameContext';
import { toPlacements } from '../state/gameReducer';

export type DragState =
  | { id: PieceId; grabCell: Cell; x: number; y: number }
  | null;

export function useDragController(
  boardRef: React.RefObject<HTMLDivElement | null>,
  cellSize: number,
) {
  const { state, dispatch } = useGame();
  const [drag, setDrag] = useState<DragState>(null);

  function startDrag(id: PieceId, grabCell: Cell, x: number, y: number) {
    dispatch({ type: 'select', id });
    setDrag({ id, grabCell, x, y });
  }

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    }
    function onUp(e: PointerEvent) {
      const rect = boardRef.current?.getBoundingClientRect();
      if (rect) {
        const hovered = cellFromPoint(e.clientX, e.clientY, rect, cellSize);
        const anchor = anchorFrom(hovered, drag!.grabCell);
        const inside = hovered.r >= 0 && hovered.r < ROWS && hovered.c >= 0 && hovered.c < COLS;
        const candidate = {
          pieceId: drag!.id,
          orientation: state.pieces[drag!.id].orientation,
          anchor,
        };
        if (inside && isLegal(toPlacements(state), candidate)) {
          dispatch({ type: 'place', id: drag!.id, anchor });
        } else if (state.pieces[drag!.id].position.kind === 'board') {
          dispatch({ type: 'remove', id: drag!.id });
        }
      }
      setDrag(null);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, boardRef, cellSize, dispatch, state]);

  return { drag, startDrag };
}
