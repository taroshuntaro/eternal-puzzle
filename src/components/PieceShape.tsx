import { getPiece, type PieceId } from '../puzzle/pieces';

export function PieceShape({
  id, orientation, cellSize,
}: { id: PieceId; orientation: number; cellSize: number }) {
  const piece = getPiece(id);
  const cells = piece.orientations[orientation];
  const maxR = Math.max(...cells.map((c) => c.r));
  const maxC = Math.max(...cells.map((c) => c.c));
  const filled = new Set(cells.map((c) => `${c.r},${c.c}`));
  const grid = [];
  for (let r = 0; r <= maxR; r++) {
    for (let c = 0; c <= maxC; c++) {
      const on = filled.has(`${r},${c}`);
      grid.push(
        <div
          key={`${r},${c}`}
          className="piece-cell"
          style={{ background: on ? piece.color : 'transparent' }}
        />,
      );
    }
  }
  return (
    <div
      className="piece-grid"
      style={{
        gridTemplateColumns: `repeat(${maxC + 1}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${maxR + 1}, ${cellSize}px)`,
      }}
    >
      {grid}
    </div>
  );
}
