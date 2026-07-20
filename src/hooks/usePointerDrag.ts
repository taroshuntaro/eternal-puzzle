import { useEffect, useState } from 'react';
import { type Cell, type PieceId } from '../puzzle/pieces';
import { cellFromPoint, anchorFrom } from '../puzzle/geometry';
import { isLegal, placedCells, cellInBounds } from '../puzzle/board';
import { useGame } from '../state/GameContext';
import { toPlacements } from '../state/gameReducer';

export type DragState =
  | { id: PieceId; grabCell: Cell; x: number; y: number }
  | null;

export type DropPreview = { cells: Cell[]; legal: boolean } | null;

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

  // 現在のポインタ位置から、盤にスナップした配置候補を算出する
  function candidateAt(x: number, y: number, d: NonNullable<DragState>) {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const hovered = cellFromPoint(x, y, rect, cellSize);
    if (!cellInBounds(hovered)) return null;
    return {
      pieceId: d.id,
      orientation: state.pieces[d.id].orientation,
      anchor: anchorFrom(hovered, d.grabCell),
    };
  }

  let preview: DropPreview = null;
  if (drag) {
    const candidate = candidateAt(drag.x, drag.y, drag);
    if (candidate) {
      preview = {
        cells: placedCells(candidate).filter(cellInBounds),
        legal: isLegal(toPlacements(state), candidate),
      };
    }
  }

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    }
    function onUp(e: PointerEvent) {
      const candidate = candidateAt(e.clientX, e.clientY, drag!);
      if (candidate && isLegal(toPlacements(state), candidate)) {
        dispatch({ type: 'place', id: drag!.id, anchor: candidate.anchor });
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
