import { useEffect, useState } from 'react';
import { type Cell, type PieceId } from '../puzzle/pieces';
import { cellFromPoint, anchorFrom } from '../puzzle/geometry';
import { ROWS, COLS, isLegal, placedCells } from '../puzzle/board';
import { useGame } from '../state/GameContext';
import { toPlacements } from '../state/gameReducer';

export type DragState =
  | { id: PieceId; grabCell: Cell; x: number; y: number }
  | null;

export type DropPreview = { cells: Cell[]; legal: boolean } | null;

function inBoardBounds(c: Cell): boolean {
  return c.r >= 0 && c.r < ROWS && c.c >= 0 && c.c < COLS;
}

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

  // 現在のポインタ位置から、盤にスナップした候補セルと合法性を算出する
  function candidateAt(x: number, y: number, d: NonNullable<DragState>) {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const hovered = cellFromPoint(x, y, rect, cellSize);
    if (!inBoardBounds(hovered)) return null;
    const anchor = anchorFrom(hovered, d.grabCell);
    const candidate = {
      pieceId: d.id,
      orientation: state.pieces[d.id].orientation,
      anchor,
    };
    return { anchor, candidate };
  }

  let preview: DropPreview = null;
  if (drag) {
    const c = candidateAt(drag.x, drag.y, drag);
    if (c) {
      preview = {
        cells: placedCells(c.candidate).filter(inBoardBounds),
        legal: isLegal(toPlacements(state), c.candidate),
      };
    }
  }

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    }
    function onUp(e: PointerEvent) {
      const c = candidateAt(e.clientX, e.clientY, drag!);
      if (c && isLegal(toPlacements(state), c.candidate)) {
        dispatch({ type: 'place', id: drag!.id, anchor: c.anchor });
      } else if (state.pieces[drag!.id].position.kind === 'board') {
        dispatch({ type: 'remove', id: drag!.id });
      }
      setDrag(null);
    }
    function onCancel() {
      setDrag(null);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [drag, boardRef, cellSize, dispatch, state]);

  return { drag, startDrag, preview };
}
