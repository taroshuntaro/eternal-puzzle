import { type Cell } from './pieces';

export function cellFromPoint(
  x: number,
  y: number,
  rect: { left: number; top: number },
  cellSize: number,
): Cell {
  return {
    r: Math.floor((y - rect.top) / cellSize),
    c: Math.floor((x - rect.left) / cellSize),
  };
}

export function anchorFrom(hoveredCell: Cell, grabCell: Cell): Cell {
  return { r: hoveredCell.r - grabCell.r, c: hoveredCell.c - grabCell.c };
}
