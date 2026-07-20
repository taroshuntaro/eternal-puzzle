export type Cell = { r: number; c: number };
export type Orientation = Cell[];
export type PieceId =
  | 'F' | 'I' | 'L' | 'N' | 'P' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export type Piece = {
  id: PieceId;
  color: string;
  orientations: Orientation[];
  rotateMap: number[]; // rotateMap[i] = 90度回転後のorientation index
  flipMap: number[];   // flipMap[i]   = 左右反転後のorientation index
};

const BASE: Record<PieceId, Cell[]> = {
  F: [{r:0,c:1},{r:0,c:2},{r:1,c:0},{r:1,c:1},{r:2,c:1}],
  I: [{r:0,c:0},{r:1,c:0},{r:2,c:0},{r:3,c:0},{r:4,c:0}],
  L: [{r:0,c:0},{r:1,c:0},{r:2,c:0},{r:3,c:0},{r:3,c:1}],
  N: [{r:0,c:1},{r:1,c:1},{r:2,c:0},{r:2,c:1},{r:3,c:0}],
  P: [{r:0,c:0},{r:0,c:1},{r:1,c:0},{r:1,c:1},{r:2,c:0}],
  T: [{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:1,c:1},{r:2,c:1}],
  U: [{r:0,c:0},{r:0,c:2},{r:1,c:0},{r:1,c:1},{r:1,c:2}],
  V: [{r:0,c:0},{r:1,c:0},{r:2,c:0},{r:2,c:1},{r:2,c:2}],
  W: [{r:0,c:0},{r:1,c:0},{r:1,c:1},{r:2,c:1},{r:2,c:2}],
  X: [{r:0,c:1},{r:1,c:0},{r:1,c:1},{r:1,c:2},{r:2,c:1}],
  Y: [{r:0,c:1},{r:1,c:0},{r:1,c:1},{r:2,c:1},{r:3,c:1}],
  Z: [{r:0,c:0},{r:0,c:1},{r:1,c:1},{r:2,c:1},{r:2,c:2}],
};

const COLORS: Record<PieceId, string> = {
  F: '#e6194b', I: '#3cb44b', L: '#ffe119', N: '#4363d8',
  P: '#f58231', T: '#911eb4', U: '#46f0f0', V: '#f032e6',
  W: '#bcf60c', X: '#fabebe', Y: '#008080', Z: '#e6beff',
};

function normalize(cells: Cell[]): Cell[] {
  const minR = Math.min(...cells.map((c) => c.r));
  const minC = Math.min(...cells.map((c) => c.c));
  return cells
    .map((c) => ({ r: c.r - minR, c: c.c - minC }))
    .sort((a, b) => a.r - b.r || a.c - b.c);
}

function key(cells: Cell[]): string {
  return normalize(cells)
    .map((c) => `${c.r},${c.c}`)
    .join(';');
}

function rotate(cells: Cell[]): Cell[] {
  // 90度回転: (r,c) -> (c, -r)
  return cells.map((c) => ({ r: c.c, c: -c.r }));
}

function reflect(cells: Cell[]): Cell[] {
  // 左右反転: (r,c) -> (r, -c)
  return cells.map((c) => ({ r: c.r, c: -c.c }));
}

function generateOrientations(base: Cell[]): Orientation[] {
  const seen = new Map<string, Orientation>();
  for (let flip = 0; flip < 2; flip++) {
    let cur = flip === 0 ? base : reflect(base);
    for (let i = 0; i < 4; i++) {
      seen.set(key(cur), normalize(cur));
      cur = rotate(cur);
    }
  }
  return [...seen.values()];
}

function buildMap(
  orientations: Orientation[],
  transform: (cells: Cell[]) => Cell[],
): number[] {
  const indexByKey = new Map(orientations.map((o, i) => [key(o), i]));
  return orientations.map((o) => indexByKey.get(key(transform(o)))!);
}

export const PIECE_IDS: PieceId[] = [
  'F','I','L','N','P','T','U','V','W','X','Y','Z',
];

export const PIECES: Piece[] = PIECE_IDS.map((id) => {
  const orientations = generateOrientations(BASE[id]);
  return {
    id,
    color: COLORS[id],
    orientations,
    rotateMap: buildMap(orientations, rotate),
    flipMap: buildMap(orientations, reflect),
  };
});

const PIECE_BY_ID = new Map(PIECES.map((p) => [p.id, p]));

export function getPiece(id: PieceId): Piece {
  return PIECE_BY_ID.get(id)!;
}
