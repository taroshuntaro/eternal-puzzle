# ペントミノ・パッキングパズル 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 12種のペントミノを6×10盤に敷き詰め、見つけた解を図鑑に集めるWebパズルを作る。

**Architecture:** `puzzle/`(React非依存の純ロジック)の上にReactのUIを乗せる層構造。状態は`useReducer`+Context、永続化はlocalStorage。パズルロジック(ピース・盤・解の正規化)を単体テストで固め、UIはそれを描画・操作するだけにする。

**Tech Stack:** Vite + React + TypeScript / Vitest + @testing-library/react (jsdom) / localStorage

## Global Constraints

- 言語: UI文言・コメントは日本語。コード識別子は英語。
- 元ネタの実在するメーカー名・商品名は**コード・UI・コミットに一切出さない**。汎用的な「ペントミノ・パズル」として実装する。
- 盤は固定: `ROWS = 6`, `COLS = 10`(60セル)。
- 解の総数の母数: `TOTAL_SOLUTIONS = 2339`。
- 外部状態管理ライブラリは追加しない(React標準のみ)。
- ドラッグはPointer Eventsで自作。ネイティブHTML5 DnDは使わない。
- コミットメッセージは英語・Conventional Commits(`feat:`, `test:`, `chore:` 等)。
- 全ての盤上配置は常に合法(盤内かつ重なりなし)を不変条件として保つ。

---

### Task 1: プロジェクト雛形とツールチェーン

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vitest.setup.ts`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Consumes: なし
- Produces: 動作する`npm test` / `npm run dev`。以降の全タスクの土台。

- [ ] **Step 1: Vite雛形を作成し依存を入れる**

作業ディレクトリ直下(`eternal-puzzle/`)で実行:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

`npm create vite`が既存ファイルの有無を尋ねたら「Ignore files and continue」を選ぶ(`docs/`は残す)。

- [ ] **Step 2: Vitestを設定する**

`vite.config.ts` を次の内容にする:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
  },
});
```

`src/vitest.setup.ts` を作成:

```ts
import '@testing-library/jest-dom';
```

`package.json` の `scripts` に追記:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: スモークテストを書く**

`src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs a trivial test', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test`
Expected: PASS (1 test passed)

- [ ] **Step 5: dev serverが起動することを確認**

Run: `npm run dev`
Expected: `Local: http://localhost:5173/` が表示される。確認後 Ctrl+C。

- [ ] **Step 6: コミット**

```bash
printf 'node_modules\ndist\n' > .gitignore
git add -A
git commit -m "chore: scaffold vite react-ts project with vitest"
```

---

### Task 2: ペントミノ定義とオリエンテーション生成

**Files:**
- Create: `src/puzzle/pieces.ts`
- Test: `src/puzzle/pieces.test.ts`

**Interfaces:**
- Consumes: なし
- Produces:
  - `type Cell = { r: number; c: number }`
  - `type Orientation = Cell[]`
  - `type PieceId = 'F'|'I'|'L'|'N'|'P'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z'`
  - `type Piece = { id: PieceId; color: string; orientations: Orientation[]; rotateMap: number[]; flipMap: number[] }`
  - `const PIECES: Piece[]`
  - `const PIECE_IDS: PieceId[]`
  - `function getPiece(id: PieceId): Piece`

- [ ] **Step 1: 失敗するテストを書く**

`src/puzzle/pieces.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PIECES, PIECE_IDS, getPiece } from './pieces';

describe('pieces', () => {
  it('has 12 pentominoes', () => {
    expect(PIECES).toHaveLength(12);
    expect(PIECE_IDS).toEqual(['F','I','L','N','P','T','U','V','W','X','Y','Z']);
  });

  it('every orientation has exactly 5 cells', () => {
    for (const p of PIECES) {
      for (const o of p.orientations) {
        expect(o).toHaveLength(5);
      }
    }
  });

  it('has correct number of unique orientations', () => {
    expect(getPiece('X').orientations).toHaveLength(1);
    expect(getPiece('I').orientations).toHaveLength(2);
    expect(getPiece('F').orientations).toHaveLength(8);
    expect(getPiece('T').orientations).toHaveLength(4);
    const total = PIECES.reduce((s, p) => s + p.orientations.length, 0);
    expect(total).toBe(63);
  });

  it('rotateMap maps each orientation to a valid index', () => {
    for (const p of PIECES) {
      expect(p.rotateMap).toHaveLength(p.orientations.length);
      for (const idx of p.rotateMap) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(p.orientations.length);
      }
    }
  });

  it('rotating four times returns to the original orientation', () => {
    for (const p of PIECES) {
      for (let i = 0; i < p.orientations.length; i++) {
        const j = p.rotateMap[p.rotateMap[p.rotateMap[p.rotateMap[i]]]];
        expect(j).toBe(i);
      }
    }
  });

  it('flipping twice returns to the original orientation', () => {
    for (const p of PIECES) {
      for (let i = 0; i < p.orientations.length; i++) {
        expect(p.flipMap[p.flipMap[i]]).toBe(i);
      }
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- pieces`
Expected: FAIL(`pieces.ts`が存在しない)

- [ ] **Step 3: 実装する**

`src/puzzle/pieces.ts`:

```ts
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- pieces`
Expected: PASS(全6テスト)

- [ ] **Step 5: コミット**

```bash
git add src/puzzle/pieces.ts src/puzzle/pieces.test.ts
git commit -m "feat: add pentomino definitions and orientation generation"
```

---

### Task 3: 盤モデル(配置の合法性・占有・完成判定)

**Files:**
- Create: `src/puzzle/board.ts`
- Test: `src/puzzle/board.test.ts`

**Interfaces:**
- Consumes: `Cell`, `PieceId`, `getPiece` from `pieces.ts`
- Produces:
  - `const ROWS = 6`, `const COLS = 10`
  - `type Placement = { pieceId: PieceId; orientation: number; anchor: Cell }`
  - `type Placements = Partial<Record<PieceId, Placement>>`
  - `function placedCells(p: Placement): Cell[]`
  - `function inBounds(cells: Cell[]): boolean`
  - `function occupancy(placements: Placements): (PieceId | null)[]` (長さ60, 行優先)
  - `function isLegal(placements: Placements, candidate: Placement): boolean`
  - `function isSolved(placements: Placements): boolean`

- [ ] **Step 1: 失敗するテストを書く**

`src/puzzle/board.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  ROWS, COLS, placedCells, inBounds, occupancy, isLegal, isSolved,
  type Placement, type Placements,
} from './board';

const iAtOrigin: Placement = { pieceId: 'I', orientation: 0, anchor: { r: 0, c: 0 } };

describe('board', () => {
  it('has a 6x10 board', () => {
    expect(ROWS).toBe(6);
    expect(COLS).toBe(10);
  });

  it('translates a placement into absolute cells', () => {
    const cells = placedCells({ pieceId: 'I', orientation: 0, anchor: { r: 1, c: 2 } });
    expect(cells).toHaveLength(5);
    expect(cells.every((c) => c.c === 2)).toBe(true);
  });

  it('detects out-of-bounds placements', () => {
    expect(inBounds(placedCells({ pieceId: 'I', orientation: 0, anchor: { r: 3, c: 0 } }))).toBe(false);
    expect(inBounds(placedCells(iAtOrigin))).toBe(true);
  });

  it('marks occupied cells with the piece id', () => {
    const grid = occupancy({ I: iAtOrigin });
    expect(grid[0]).toBe('I');
    expect(grid[COLS]).toBe('I'); // (r1,c0)
    expect(grid[1]).toBeNull();
  });

  it('rejects overlapping placements', () => {
    const placements: Placements = { I: iAtOrigin };
    const overlap: Placement = { pieceId: 'L', orientation: 0, anchor: { r: 0, c: 0 } };
    expect(isLegal(placements, overlap)).toBe(false);
  });

  it('allows a non-overlapping in-bounds placement', () => {
    const placements: Placements = { I: iAtOrigin };
    const ok: Placement = { pieceId: 'L', orientation: 0, anchor: { r: 0, c: 5 } };
    expect(isLegal(placements, ok)).toBe(true);
  });

  it('ignores the candidate own previous placement', () => {
    const placements: Placements = { I: iAtOrigin };
    // 同じIを別の合法位置へ動かす: 自分自身とは衝突しない
    const moved: Placement = { pieceId: 'I', orientation: 0, anchor: { r: 0, c: 1 } };
    expect(isLegal(placements, moved)).toBe(true);
  });

  it('is not solved when the board is not full', () => {
    expect(isSolved({ I: iAtOrigin })).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- board`
Expected: FAIL(`board.ts`が存在しない)

- [ ] **Step 3: 実装する**

`src/puzzle/board.ts`:

```ts
import { type Cell, type PieceId, getPiece } from './pieces';

export const ROWS = 6;
export const COLS = 10;

export type Placement = {
  pieceId: PieceId;
  orientation: number;
  anchor: Cell;
};

export type Placements = Partial<Record<PieceId, Placement>>;

export function placedCells(p: Placement): Cell[] {
  const orientation = getPiece(p.pieceId).orientations[p.orientation];
  return orientation.map((c) => ({ r: c.r + p.anchor.r, c: c.c + p.anchor.c }));
}

export function inBounds(cells: Cell[]): boolean {
  return cells.every((c) => c.r >= 0 && c.r < ROWS && c.c >= 0 && c.c < COLS);
}

export function occupancy(placements: Placements): (PieceId | null)[] {
  const grid: (PieceId | null)[] = new Array(ROWS * COLS).fill(null);
  for (const p of Object.values(placements)) {
    if (!p) continue;
    for (const cell of placedCells(p)) {
      grid[cell.r * COLS + cell.c] = p.pieceId;
    }
  }
  return grid;
}

export function isLegal(placements: Placements, candidate: Placement): boolean {
  const cells = placedCells(candidate);
  if (!inBounds(cells)) return false;
  const others: Placements = { ...placements };
  delete others[candidate.pieceId];
  const grid = occupancy(others);
  return cells.every((c) => grid[c.r * COLS + c.c] === null);
}

export function isSolved(placements: Placements): boolean {
  return occupancy(placements).every((cell) => cell !== null);
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- board`
Expected: PASS(全8テスト)

- [ ] **Step 5: コミット**

```bash
git add src/puzzle/board.ts src/puzzle/board.test.ts
git commit -m "feat: add board model with placement legality and solved check"
```

---

### Task 4: 解の正規化(対称性による重複排除)

**Files:**
- Create: `src/puzzle/solution.ts`
- Test: `src/puzzle/solution.test.ts`

**Interfaces:**
- Consumes: `PieceId` from `pieces.ts`; `ROWS`, `COLS`, `occupancy`, `Placements` from `board.ts`
- Produces:
  - `type SolutionGrid = PieceId[]` (長さ60, 行優先, nullなし)
  - `function toSolutionGrid(placements: Placements): SolutionGrid`
  - `function canonicalKey(grid: SolutionGrid): string`
  - `const TOTAL_SOLUTIONS = 2339`

- [ ] **Step 1: 失敗するテストを書く**

`src/puzzle/solution.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ROWS, COLS } from './board';
import { canonicalKey, TOTAL_SOLUTIONS, type SolutionGrid } from './solution';
import type { PieceId } from './pieces';

// テスト用の擬似解グリッド(実在の解である必要はない。対称変換の不変性のみ検証)
function sampleGrid(): SolutionGrid {
  const ids: PieceId[] = ['F','I','L','N','P','T','U','V','W','X','Y','Z'];
  const grid: PieceId[] = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    grid.push(ids[Math.floor(i / 5) % 12]);
  }
  return grid;
}

function rotate180(grid: SolutionGrid): SolutionGrid {
  return [...grid].reverse();
}
function mirrorH(grid: SolutionGrid): SolutionGrid {
  const out: PieceId[] = new Array(ROWS * COLS);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      out[r * COLS + c] = grid[r * COLS + (COLS - 1 - c)];
  return out;
}
function mirrorV(grid: SolutionGrid): SolutionGrid {
  const out: PieceId[] = new Array(ROWS * COLS);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      out[r * COLS + c] = grid[(ROWS - 1 - r) * COLS + c];
  return out;
}

describe('solution canonicalization', () => {
  it('exposes the known total solution count', () => {
    expect(TOTAL_SOLUTIONS).toBe(2339);
  });

  it('gives the same key for all four symmetric variants', () => {
    const g = sampleGrid();
    const base = canonicalKey(g);
    expect(canonicalKey(rotate180(g))).toBe(base);
    expect(canonicalKey(mirrorH(g))).toBe(base);
    expect(canonicalKey(mirrorV(g))).toBe(base);
  });

  it('gives different keys for genuinely different solutions', () => {
    const g = sampleGrid();
    const h = [...g];
    // 対称では移り合わない改変(先頭セルだけ別ピースに)を作る
    h[0] = h[0] === 'Z' ? 'F' : 'Z';
    expect(canonicalKey(h)).not.toBe(canonicalKey(g));
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- solution`
Expected: FAIL(`solution.ts`が存在しない)

- [ ] **Step 3: 実装する**

`src/puzzle/solution.ts`:

```ts
import { type PieceId } from './pieces';
import { ROWS, COLS, occupancy, type Placements } from './board';

export type SolutionGrid = PieceId[]; // 長さ ROWS*COLS, 行優先, nullなし

export const TOTAL_SOLUTIONS = 2339;

export function toSolutionGrid(placements: Placements): SolutionGrid {
  const grid = occupancy(placements);
  if (grid.some((cell) => cell === null)) {
    throw new Error('board is not full');
  }
  return grid as PieceId[];
}

function serialize(grid: SolutionGrid): string {
  return grid.join(''); // PieceIdは1文字なので連結で一意
}

function rotate180(grid: SolutionGrid): SolutionGrid {
  return [...grid].reverse();
}

function mirrorH(grid: SolutionGrid): SolutionGrid {
  const out: PieceId[] = new Array(ROWS * COLS);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      out[r * COLS + c] = grid[r * COLS + (COLS - 1 - c)];
  return out;
}

function mirrorV(grid: SolutionGrid): SolutionGrid {
  const out: PieceId[] = new Array(ROWS * COLS);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      out[r * COLS + c] = grid[(ROWS - 1 - r) * COLS + c];
  return out;
}

export function canonicalKey(grid: SolutionGrid): string {
  const variants = [grid, rotate180(grid), mirrorH(grid), mirrorV(grid)];
  return variants.map(serialize).sort()[0];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- solution`
Expected: PASS(全3テスト)

- [ ] **Step 5: コミット**

```bash
git add src/puzzle/solution.ts src/puzzle/solution.test.ts
git commit -m "feat: add solution canonicalization with symmetry dedup"
```

---

### Task 5: ゲーム状態のreducer

**Files:**
- Create: `src/state/gameReducer.ts`
- Test: `src/state/gameReducer.test.ts`

**Interfaces:**
- Consumes: `PieceId`, `PIECE_IDS`, `getPiece` from `pieces.ts`; `Cell`, `Placement`, `Placements`, `isLegal`, `isSolved` from `board.ts`
- Produces:
  - `type PiecePosition = { kind: 'tray' } | { kind: 'board'; anchor: Cell }`
  - `type PieceState = { orientation: number; position: PiecePosition }`
  - `type GameState = { pieces: Record<PieceId, PieceState>; selected: PieceId | null }`
  - `type Action =`
    - `| { type: 'select'; id: PieceId | null }`
    - `| { type: 'rotate' }`
    - `| { type: 'flip' }`
    - `| { type: 'place'; id: PieceId; anchor: Cell }`
    - `| { type: 'remove'; id: PieceId }`
    - `| { type: 'reset' }`
    - `| { type: 'load'; state: GameState }`
  - `function initialState(): GameState`
  - `function toPlacements(state: GameState): Placements`
  - `function gameReducer(state: GameState, action: Action): GameState`

- [ ] **Step 1: 失敗するテストを書く**

`src/state/gameReducer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { initialState, gameReducer, toPlacements } from './gameReducer';
import { isSolved } from '../puzzle/board';
import { getPiece } from '../puzzle/pieces';

describe('gameReducer', () => {
  it('starts with all pieces in the tray and nothing selected', () => {
    const s = initialState();
    expect(s.selected).toBeNull();
    expect(Object.values(s.pieces).every((p) => p.position.kind === 'tray')).toBe(true);
    expect(toPlacements(s)).toEqual({});
  });

  it('selects a piece', () => {
    const s = gameReducer(initialState(), { type: 'select', id: 'F' });
    expect(s.selected).toBe('F');
  });

  it('rotates the selected piece via rotateMap', () => {
    let s = gameReducer(initialState(), { type: 'select', id: 'F' });
    s = gameReducer(s, { type: 'rotate' });
    expect(s.pieces.F.orientation).toBe(getPiece('F').rotateMap[0]);
  });

  it('places a piece on the board when legal', () => {
    let s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 0, c: 0 } });
    expect(s.pieces.I.position).toEqual({ kind: 'board', anchor: { r: 0, c: 0 } });
    expect(toPlacements(s).I).toBeDefined();
  });

  it('rejects an illegal placement (out of bounds)', () => {
    const s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 5, c: 0 } });
    expect(s.pieces.I.position.kind).toBe('tray');
  });

  it('rejects a rotation that would make a board piece illegal, keeping it legal', () => {
    // Iを右端付近に縦置き -> 横向きに回転すると盤外になるので拒否される
    let s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 0, c: 9 } });
    s = gameReducer(s, { type: 'select', id: 'I' });
    const before = s.pieces.I.orientation;
    s = gameReducer(s, { type: 'rotate' });
    expect(s.pieces.I.orientation).toBe(before); // 変化なし(拒否)
  });

  it('removes a placed piece back to the tray', () => {
    let s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 0, c: 0 } });
    s = gameReducer(s, { type: 'remove', id: 'I' });
    expect(s.pieces.I.position.kind).toBe('tray');
    expect(toPlacements(s)).toEqual({});
  });

  it('resets to the initial state', () => {
    let s = gameReducer(initialState(), { type: 'place', id: 'I', anchor: { r: 0, c: 0 } });
    s = gameReducer(s, { type: 'reset' });
    expect(toPlacements(s)).toEqual({});
  });

  it('never reports solved for the empty board', () => {
    expect(isSolved(toPlacements(initialState()))).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- gameReducer`
Expected: FAIL(`gameReducer.ts`が存在しない)

- [ ] **Step 3: 実装する**

`src/state/gameReducer.ts`:

```ts
import { type PieceId, PIECE_IDS, getPiece } from '../puzzle/pieces';
import {
  type Cell, type Placement, type Placements, isLegal,
} from '../puzzle/board';

export type PiecePosition =
  | { kind: 'tray' }
  | { kind: 'board'; anchor: Cell };

export type PieceState = {
  orientation: number;
  position: PiecePosition;
};

export type GameState = {
  pieces: Record<PieceId, PieceState>;
  selected: PieceId | null;
};

export type Action =
  | { type: 'select'; id: PieceId | null }
  | { type: 'rotate' }
  | { type: 'flip' }
  | { type: 'place'; id: PieceId; anchor: Cell }
  | { type: 'remove'; id: PieceId }
  | { type: 'reset' }
  | { type: 'load'; state: GameState };

export function initialState(): GameState {
  const pieces = {} as Record<PieceId, PieceState>;
  for (const id of PIECE_IDS) {
    pieces[id] = { orientation: 0, position: { kind: 'tray' } };
  }
  return { pieces, selected: null };
}

export function toPlacements(state: GameState): Placements {
  const result: Placements = {};
  for (const id of PIECE_IDS) {
    const p = state.pieces[id];
    if (p.position.kind === 'board') {
      result[id] = { pieceId: id, orientation: p.orientation, anchor: p.position.anchor };
    }
  }
  return result;
}

function setPiece(state: GameState, id: PieceId, next: PieceState): GameState {
  return { ...state, pieces: { ...state.pieces, [id]: next } };
}

// 選択中ピースの向きをtransitionで変える。盤上の場合は合法な時だけ適用する。
function reorient(state: GameState, transition: (p: PieceId, o: number) => number): GameState {
  const id = state.selected;
  if (!id) return state;
  const cur = state.pieces[id];
  const nextOrientation = transition(id, cur.orientation);
  if (cur.position.kind === 'board') {
    const candidate: Placement = {
      pieceId: id, orientation: nextOrientation, anchor: cur.position.anchor,
    };
    if (!isLegal(toPlacements(state), candidate)) return state;
  }
  return setPiece(state, id, { ...cur, orientation: nextOrientation });
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'select':
      return { ...state, selected: action.id };

    case 'rotate':
      return reorient(state, (id, o) => getPiece(id).rotateMap[o]);

    case 'flip':
      return reorient(state, (id, o) => getPiece(id).flipMap[o]);

    case 'place': {
      const cur = state.pieces[action.id];
      const candidate: Placement = {
        pieceId: action.id, orientation: cur.orientation, anchor: action.anchor,
      };
      if (!isLegal(toPlacements(state), candidate)) return state;
      return setPiece(
        { ...state, selected: action.id },
        action.id,
        { ...cur, position: { kind: 'board', anchor: action.anchor } },
      );
    }

    case 'remove':
      return setPiece(state, action.id, {
        ...state.pieces[action.id],
        position: { kind: 'tray' },
      });

    case 'reset':
      return initialState();

    case 'load':
      return action.state;
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- gameReducer`
Expected: PASS(全9テスト)

- [ ] **Step 5: コミット**

```bash
git add src/state/gameReducer.ts src/state/gameReducer.test.ts
git commit -m "feat: add game state reducer with legal-only mutations"
```

---

### Task 6: 図鑑の永続化(localStorage)

**Files:**
- Create: `src/storage/collection.ts`
- Test: `src/storage/collection.test.ts`

**Interfaces:**
- Consumes: なし(文字列キーのみ扱う)
- Produces:
  - `type FoundSolution = { key: string; foundAt: number }`
  - `function loadCollection(): FoundSolution[]`
  - `function addSolution(key: string, now?: number): { added: boolean; collection: FoundSolution[] }` (既存キーなら`added:false`)
  - `function loadProgress(): unknown | null`
  - `function saveProgress(state: unknown): void`
  - `function clearProgress(): void`

- [ ] **Step 1: 失敗するテストを書く**

`src/storage/collection.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCollection, addSolution, loadProgress, saveProgress, clearProgress,
} from './collection';

beforeEach(() => {
  localStorage.clear();
});

describe('collection storage', () => {
  it('starts empty', () => {
    expect(loadCollection()).toEqual([]);
  });

  it('adds a new solution', () => {
    const res = addSolution('AAAAA', 1000);
    expect(res.added).toBe(true);
    expect(res.collection).toHaveLength(1);
    expect(res.collection[0]).toEqual({ key: 'AAAAA', foundAt: 1000 });
    expect(loadCollection()).toHaveLength(1);
  });

  it('does not double-count the same key', () => {
    addSolution('AAAAA', 1000);
    const res = addSolution('AAAAA', 2000);
    expect(res.added).toBe(false);
    expect(res.collection).toHaveLength(1);
  });

  it('persists progress round-trip', () => {
    saveProgress({ hello: 'world' });
    expect(loadProgress()).toEqual({ hello: 'world' });
    clearProgress();
    expect(loadProgress()).toBeNull();
  });

  it('returns empty collection when stored data is corrupt', () => {
    localStorage.setItem('eternal-puzzle:pentomino:collection', 'not json');
    expect(loadCollection()).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- collection`
Expected: FAIL(`collection.ts`が存在しない)

- [ ] **Step 3: 実装する**

`src/storage/collection.ts`:

```ts
export type FoundSolution = { key: string; foundAt: number };

const COLLECTION_KEY = 'eternal-puzzle:pentomino:collection';
const PROGRESS_KEY = 'eternal-puzzle:pentomino:progress';
const VERSION = 1;

type CollectionFile = { version: number; solutions: FoundSolution[] };

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage無効/容量超過時はメモリ内動作にフォールバック(保存しない)
  }
}

export function loadCollection(): FoundSolution[] {
  const raw = safeGet(COLLECTION_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CollectionFile;
    if (!parsed || !Array.isArray(parsed.solutions)) return [];
    return parsed.solutions;
  } catch {
    return [];
  }
}

export function addSolution(
  key: string,
  now: number = Date.now(),
): { added: boolean; collection: FoundSolution[] } {
  const current = loadCollection();
  if (current.some((s) => s.key === key)) {
    return { added: false, collection: current };
  }
  const next = [...current, { key, foundAt: now }];
  const file: CollectionFile = { version: VERSION, solutions: next };
  safeSet(COLLECTION_KEY, JSON.stringify(file));
  return { added: true, collection: next };
}

export function loadProgress(): unknown | null {
  const raw = safeGet(PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProgress(state: unknown): void {
  safeSet(PROGRESS_KEY, JSON.stringify(state));
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // no-op
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- collection`
Expected: PASS(全5テスト)

- [ ] **Step 5: コミット**

```bash
git add src/storage/collection.ts src/storage/collection.test.ts
git commit -m "feat: add localStorage-backed collection and progress storage"
```

---

### Task 7: ドラッグ座標計算のユーティリティ

**Files:**
- Create: `src/puzzle/geometry.ts`
- Test: `src/puzzle/geometry.test.ts`

**Interfaces:**
- Consumes: `Cell` from `pieces.ts`
- Produces:
  - `function cellFromPoint(x: number, y: number, rect: { left: number; top: number }, cellSize: number): Cell` (盤ローカル座標→セル。範囲外もそのまま返す)
  - `function anchorFrom(hoveredCell: Cell, grabCell: Cell): Cell` (掴んだセルとホバーセルからアンカーを算出)

- [ ] **Step 1: 失敗するテストを書く**

`src/puzzle/geometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cellFromPoint, anchorFrom } from './geometry';

describe('geometry', () => {
  it('maps a pixel point to a board cell', () => {
    const rect = { left: 100, top: 50 };
    expect(cellFromPoint(100, 50, rect, 40)).toEqual({ r: 0, c: 0 });
    expect(cellFromPoint(145, 95, rect, 40)).toEqual({ r: 1, c: 1 });
  });

  it('computes anchor so the grabbed cell lands on the hovered cell', () => {
    // orientation内で(1,2)のセルを掴み、盤の(3,4)にホバー -> anchorは(2,2)
    expect(anchorFrom({ r: 3, c: 4 }, { r: 1, c: 2 })).toEqual({ r: 2, c: 2 });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- geometry`
Expected: FAIL(`geometry.ts`が存在しない)

- [ ] **Step 3: 実装する**

`src/puzzle/geometry.ts`:

```ts
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- geometry`
Expected: PASS(全2テスト)

- [ ] **Step 5: コミット**

```bash
git add src/puzzle/geometry.ts src/puzzle/geometry.test.ts
git commit -m "feat: add drag geometry helpers"
```

---

### Task 8: Context provider(reducer + 永続化の配線)

**Files:**
- Create: `src/state/GameContext.tsx`
- Test: `src/state/GameContext.test.tsx`

**Interfaces:**
- Consumes: `gameReducer`, `initialState`, `GameState`, `Action`, `toPlacements` from `gameReducer.ts`; `isSolved` from `board.ts`; `toSolutionGrid`, `canonicalKey` from `solution.ts`; storage functions from `collection.ts`
- Produces:
  - `function GameProvider({ children }: { children: React.ReactNode }): JSX.Element`
  - `function useGame(): { state: GameState; dispatch: React.Dispatch<Action> }`
  - 副作用: `state`変化時に`saveProgress(state)`を呼ぶ。マウント時に`loadProgress()`で復帰。

- [ ] **Step 1: 失敗するテストを書く**

`src/state/GameContext.test.tsx`:

```tsx
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- GameContext`
Expected: FAIL(`GameContext.tsx`が存在しない)

- [ ] **Step 3: 実装する**

`src/state/GameContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useReducer } from 'react';
import {
  gameReducer, initialState, type GameState, type Action,
} from './gameReducer';
import { loadProgress, saveProgress } from '../storage/collection';

type GameContextValue = { state: GameState; dispatch: React.Dispatch<Action> };

const GameContext = createContext<GameContextValue | null>(null);

function initFromStorage(): GameState {
  const saved = loadProgress();
  if (saved && typeof saved === 'object' && 'pieces' in saved) {
    return saved as GameState;
  }
  return initialState();
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initFromStorage);

  useEffect(() => {
    saveProgress(state);
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- GameContext`
Expected: PASS(全2テスト)

- [ ] **Step 5: コミット**

```bash
git add src/state/GameContext.tsx src/state/GameContext.test.tsx
git commit -m "feat: add game context provider with progress persistence"
```

---

### Task 9: 盤・ピース・トレイの描画＋選択とキーボード操作

**Files:**
- Create: `src/components/Board.tsx`, `src/components/Tray.tsx`, `src/components/PieceShape.tsx`, `src/styles.css`
- Test: `src/components/Board.test.tsx`

**Interfaces:**
- Consumes: `useGame`; `toPlacements`, `occupancy`, `ROWS`, `COLS`; `getPiece`, `PIECE_IDS`
- Produces:
  - `function Board(props: { cellSize: number; boardRef: React.RefObject<HTMLDivElement> }): JSX.Element` — 6×10グリッドを描画、占有セルをピース色で塗る。
  - `function Tray(): JSX.Element` — 未配置ピースをクリックで選択(選択中は枠強調)。
  - `function PieceShape(props: { id: PieceId; orientation: number; cellSize: number }): JSX.Element` — 1ピースの形をミニグリッドで描画。
  - キーボード: `R`=rotate, `F`=flip をwindowリスナで`dispatch`。

- [ ] **Step 1: 失敗するテストを書く**

`src/components/Board.test.tsx`:

```tsx
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- Board`
Expected: FAIL(`Board.tsx`が存在しない)

- [ ] **Step 3: 実装する**

`src/styles.css`:

```css
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; background: #1b1b1f; color: #eee; }
.app { max-width: 900px; margin: 0 auto; padding: 16px; }
.board { display: grid; background: #333; border: 2px solid #555; width: fit-content; }
.cell { border: 1px solid #444; }
.tray { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.tray-piece { padding: 6px; border: 2px solid transparent; cursor: pointer; background: #26262b; }
.tray-piece.selected { border-color: #fff; }
.piece-grid { display: grid; }
.piece-cell { width: 100%; height: 100%; }
.controls { display: flex; gap: 8px; margin: 12px 0; }
button { background: #3a3a42; color: #eee; border: 1px solid #555; padding: 6px 12px; cursor: pointer; }
```

`src/components/PieceShape.tsx`:

```tsx
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
```

`src/components/Tray.tsx`:

```tsx
import { useGame } from '../state/GameContext';
import { PIECE_IDS } from '../puzzle/pieces';
import { PieceShape } from './PieceShape';

export function Tray() {
  const { state, dispatch } = useGame();
  const trayIds = PIECE_IDS.filter((id) => state.pieces[id].position.kind === 'tray');
  return (
    <div className="tray">
      {trayIds.map((id) => (
        <div
          key={id}
          className={`tray-piece${state.selected === id ? ' selected' : ''}`}
          onClick={() => dispatch({ type: 'select', id })}
          data-testid={`tray-piece-${id}`}
        >
          <PieceShape id={id} orientation={state.pieces[id].orientation} cellSize={20} />
        </div>
      ))}
    </div>
  );
}
```

`src/components/Board.tsx`:

```tsx
import { useEffect } from 'react';
import { useGame } from '../state/GameContext';
import { toPlacements } from '../state/gameReducer';
import { occupancy, COLS } from '../puzzle/board';
import { getPiece } from '../puzzle/pieces';

export function Board({
  cellSize, boardRef, onCellPointerDown,
}: {
  cellSize: number;
  boardRef: React.RefObject<HTMLDivElement>;
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- Board`
Expected: PASS(全2テスト)

- [ ] **Step 5: コミット**

```bash
git add src/components/ src/styles.css
git commit -m "feat: render board, tray, and piece shapes with keyboard controls"
```

---

### Task 10: ドラッグ＆ドロップ配置(Pointer Events)

**Files:**
- Create: `src/hooks/usePointerDrag.ts`
- Modify: `src/components/Tray.tsx`(ドラッグ開始を`onGrab`経由に)
- Test: 手動検証(ドラッグはjsdomで忠実に再現しにくいため)。座標計算はTask 7で、盤ピックアップ用の`onCellPointerDown` propはTask 9で担保済み。Appへの統合はTask 12。

**Interfaces:**
- Consumes: `cellFromPoint`, `anchorFrom` from `geometry.ts`; `isLegal`, `toPlacements`; `useGame`
- Produces:
  - `type DragState = { id: PieceId; grabCell: Cell; x: number; y: number } | null`
  - `function useDragController(boardRef): { drag; startDrag(id, grabCell, x, y); }` — pointermove/upはwindowで購読。ドロップ時、盤上の合法セルなら`place`、盤外なら`remove`(盤上ピースの場合)を`dispatch`。

- [ ] **Step 1: ドラッグコントローラを実装**

`src/hooks/usePointerDrag.ts`:

```tsx
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
  boardRef: React.RefObject<HTMLDivElement>,
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
```

- [ ] **Step 2: TrayとBoardからドラッグ開始できるよう配線**

`src/components/Tray.tsx` の `onClick` を `onPointerDown` に置き換え(`App`から渡す`onGrab`を使う形にするため、Trayを次のように変更):

```tsx
import { useGame } from '../state/GameContext';
import { PIECE_IDS, type PieceId } from '../puzzle/pieces';
import { PieceShape } from './PieceShape';

export function Tray({
  onGrab,
}: {
  onGrab: (id: PieceId, e: React.PointerEvent) => void;
}) {
  const { state } = useGame();
  const trayIds = PIECE_IDS.filter((id) => state.pieces[id].position.kind === 'tray');
  return (
    <div className="tray">
      {trayIds.map((id) => (
        <div
          key={id}
          className={`tray-piece${state.selected === id ? ' selected' : ''}`}
          onPointerDown={(e) => onGrab(id, e)}
          data-testid={`tray-piece-${id}`}
        >
          <PieceShape id={id} orientation={state.pieces[id].orientation} cellSize={20} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: ドラッグ中のゴースト表示をAppに追加(下記Task 12のApp内で統合)**

このステップはTask 12のApp実装で、`drag`が非nullの間、カーソル追従の半透明`PieceShape`を`position: fixed`で表示する形で組み込む(コードはTask 12参照)。

- [ ] **Step 4: 手動検証**

Run: `npm run dev`
Expected(ブラウザで確認):
- トレイのピースをドラッグして盤の合法セルで離すと配置される。
- 盤上ピースを盤外へドラッグして離すとトレイに戻る。
- ドラッグ中に`R`/`F`で回転・反転してから置ける。

- [ ] **Step 5: コミット**

```bash
git add src/hooks/usePointerDrag.ts src/components/Tray.tsx
git commit -m "feat: add pointer-based drag controller for placing pieces"
```

---

### Task 11: 完成判定・図鑑保存・完成ダイアログ

**Files:**
- Create: `src/components/SolvedDialog.tsx`
- Modify: `src/state/GameContext.tsx`(完成検知フックを公開)
- Test: `src/components/SolvedDialog.test.tsx`

**Interfaces:**
- Consumes: `isSolved`, `toPlacements`; `toSolutionGrid`, `canonicalKey`, `TOTAL_SOLUTIONS`; `addSolution`; `useGame`
- Produces:
  - `function SolvedDialog(): JSX.Element | null` — propsなし。完成を検知したら`addSolution`し、新発見/既出と発見数を表示。自分でdismiss状態を持つ(閉じたら同じ解では再表示しない)。

- [ ] **Step 1: 失敗するテストを書く(フックのロジック)**

`src/components/SolvedDialog.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { loadCollection } from '../storage/collection';
import { canonicalKey } from '../puzzle/solution';
import { SolvedDialog } from './SolvedDialog';
import { GameProvider } from '../state/GameContext';

beforeEach(() => localStorage.clear());

describe('SolvedDialog', () => {
  it('renders nothing when the board is not solved', () => {
    const { container } = render(
      <GameProvider>
        <SolvedDialog />
      </GameProvider>,
    );
    // 未完成なのでダイアログのroleは存在しない
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container).toBeTruthy();
  });

  it('canonicalKey is stable (guard for dialog dedup logic)', () => {
    const a = new Array(60).fill('A');
    expect(canonicalKey(a as any)).toBe(canonicalKey(a as any));
    expect(loadCollection()).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- SolvedDialog`
Expected: FAIL(`SolvedDialog.tsx`が存在しない)

- [ ] **Step 3: 実装する**

`src/components/SolvedDialog.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext';
import { toPlacements } from '../state/gameReducer';
import { isSolved } from '../puzzle/board';
import { toSolutionGrid, canonicalKey, TOTAL_SOLUTIONS } from '../puzzle/solution';
import { addSolution } from '../storage/collection';

export function SolvedDialog() {
  const { state, dispatch } = useGame();
  const solved = isSolved(toPlacements(state));
  const [result, setResult] = useState<{ key: string; isNew: boolean; count: number } | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const handledKey = useRef<string | null>(null);

  useEffect(() => {
    if (!solved) {
      handledKey.current = null;
      setResult(null);
      return;
    }
    const key = canonicalKey(toSolutionGrid(toPlacements(state)));
    if (handledKey.current === key) return; // 同じ完成を二重処理しない
    handledKey.current = key;
    const { added, collection } = addSolution(key);
    setResult({ key, isNew: added, count: collection.length });
  }, [solved, state]);

  // 完成しておらず、または表示すべき結果がなく、または既に閉じた解なら描画しない
  if (!solved || !result || result.key === dismissedKey) return null;

  return (
    <div role="dialog" aria-label="完成" className="dialog-backdrop">
      <div className="dialog">
        <h2>{result.isNew ? '新発見！' : 'この解は発見済みです'}</h2>
        <p>{TOTAL_SOLUTIONS}通り中 {result.count}通り発見</p>
        <div className="dialog-actions">
          <button onClick={() => dispatch({ type: 'reset' })}>もう一度</button>
          <button onClick={() => setDismissedKey(result.key)}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
```

`src/styles.css` に追記:

```css
.dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; }
.dialog { background: #26262b; padding: 24px; border-radius: 8px; text-align: center; }
.dialog-actions { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- SolvedDialog`
Expected: PASS(全2テスト)

- [ ] **Step 5: コミット**

```bash
git add src/components/SolvedDialog.tsx src/styles.css
git commit -m "feat: add solved detection dialog with new/known distinction"
```

---

### Task 12: 図鑑ビュー・App統合・ドラッグゴースト

**Files:**
- Create: `src/components/Collection.tsx`, `src/components/Controls.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/components/Collection.test.tsx`

**Interfaces:**
- Consumes: `loadCollection`, `TOTAL_SOLUTIONS`, `ROWS`, `COLS`; `useGame`, `useDragController`; `getPiece`
- Produces:
  - `function Collection(): JSX.Element` — 「N通り中M通り発見」＋発見済みキーをサムネ表示。
  - `function Controls(props): JSX.Element` — 回転/反転/リセット/表示切替ボタン。
  - `App` — Board+Tray+Controls+Collection切替+ドラッグゴースト+SolvedDialogを統合。

- [ ] **Step 1: 失敗するテストを書く**

`src/components/Collection.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { addSolution } from '../storage/collection';
import { TOTAL_SOLUTIONS } from '../puzzle/solution';
import { Collection } from './Collection';

beforeEach(() => localStorage.clear());

describe('Collection', () => {
  it('shows the found count out of the total', () => {
    addSolution('A'.repeat(60));
    render(<Collection />);
    expect(screen.getByText(new RegExp(`${TOTAL_SOLUTIONS}`))).toBeTruthy();
    expect(screen.getByText(/1通り発見/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- Collection`
Expected: FAIL(`Collection.tsx`が存在しない)

- [ ] **Step 3: 実装する**

`src/components/Collection.tsx`:

```tsx
import { useState } from 'react';
import { loadCollection } from '../storage/collection';
import { TOTAL_SOLUTIONS } from '../puzzle/solution';
import { COLS } from '../puzzle/board';
import { getPiece, type PieceId } from '../puzzle/pieces';

function SolutionGridView({ solutionKey, cell }: { solutionKey: string; cell: number }) {
  // canonicalKeyは正規化後の行優先PieceId列(長さ60)
  const ids = solutionKey.split('') as PieceId[];
  return (
    <div className="thumb" style={{ gridTemplateColumns: `repeat(${COLS}, ${cell}px)` }}>
      {ids.map((id, i) => (
        <div key={i} style={{ width: cell, height: cell, background: getPiece(id).color }} />
      ))}
    </div>
  );
}

export function Collection() {
  const found = loadCollection();
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  return (
    <div className="collection">
      <h2>図鑑</h2>
      <p className="count">{TOTAL_SOLUTIONS}通り中 {found.length}通り発見</p>
      <div className="thumb-list">
        {found.map((s) => (
          <button
            key={s.key}
            className="thumb-button"
            onClick={() => setViewingKey(s.key)}
            aria-label="解を拡大表示"
          >
            <SolutionGridView solutionKey={s.key} cell={6} />
          </button>
        ))}
      </div>
      {viewingKey && (
        <div role="dialog" aria-label="解の再現" className="dialog-backdrop" onClick={() => setViewingKey(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <SolutionGridView solutionKey={viewingKey} cell={28} />
            <div className="dialog-actions">
              <button onClick={() => setViewingKey(null)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

`src/styles.css` に追記:

```css
.thumb { display: grid; gap: 0; border: 1px solid #555; }
.thumb-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.thumb-button { padding: 0; border: none; background: none; cursor: pointer; }
.count { font-size: 20px; font-weight: bold; }
.ghost { position: fixed; pointer-events: none; opacity: 0.7; z-index: 10; }
```

`src/components/Controls.tsx`:

```tsx
import { useGame } from '../state/GameContext';

export function Controls({
  view, onToggleView,
}: { view: 'play' | 'collection'; onToggleView: () => void }) {
  const { dispatch } = useGame();
  return (
    <div className="controls">
      <button onClick={() => dispatch({ type: 'rotate' })}>回転 (R)</button>
      <button onClick={() => dispatch({ type: 'flip' })}>反転 (F)</button>
      <button onClick={() => dispatch({ type: 'reset' })}>リセット</button>
      <button onClick={onToggleView}>
        {view === 'play' ? '図鑑を見る' : 'パズルに戻る'}
      </button>
    </div>
  );
}
```

`src/App.tsx`:

```tsx
import { useRef, useState } from 'react';
import { GameProvider } from './state/GameContext';
import { Board } from './components/Board';
import { Tray } from './components/Tray';
import { Controls } from './components/Controls';
import { Collection } from './components/Collection';
import { SolvedDialog } from './components/SolvedDialog';
import { useDragController } from './hooks/usePointerDrag';
import { PieceShape } from './components/PieceShape';
import { type PieceId } from './puzzle/pieces';
import { occupancy, COLS } from './puzzle/board';
import { toPlacements } from './state/gameReducer';
import { useGame } from './state/GameContext';
import './styles.css';

const CELL = 36;

function Game() {
  const boardRef = useRef<HTMLDivElement>(null);
  const { state } = useGame();
  const { drag, startDrag } = useDragController(boardRef, CELL);
  const [view, setView] = useState<'play' | 'collection'>('play');

  function onGrab(id: PieceId, e: React.PointerEvent) {
    // トレイからは原点(0,0)セルを掴んだ扱いにする
    startDrag(id, { r: 0, c: 0 }, e.clientX, e.clientY);
  }

  // 盤上のセルを掴んだら、そのセルにあるピースをドラッグ開始する
  function onCellPointerDown(r: number, c: number, e: React.PointerEvent) {
    const id = occupancy(toPlacements(state))[r * COLS + c];
    if (!id) return;
    const pos = state.pieces[id].position;
    if (pos.kind !== 'board') return;
    startDrag(id, { r: r - pos.anchor.r, c: c - pos.anchor.c }, e.clientX, e.clientY);
  }

  return (
    <div className="app">
      <h1>ペントミノ・パズル</h1>
      <Controls view={view} onToggleView={() => setView(view === 'play' ? 'collection' : 'play')} />
      {view === 'play' ? (
        <>
          <Board cellSize={CELL} boardRef={boardRef} onCellPointerDown={onCellPointerDown} />
          <Tray onGrab={onGrab} />
          <SolvedDialog />
        </>
      ) : (
        <Collection />
      )}
      {drag && (
        <div className="ghost" style={{ left: drag.x + 8, top: drag.y + 8 }}>
          <PieceShape
            id={drag.id}
            orientation={state.pieces[drag.id].orientation}
            cellSize={CELL}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
```

`src/main.tsx` を確認/修正(Vite雛形のまま`App`をレンダリングしていればOK):

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- Collection`
Expected: PASS(1テスト)

- [ ] **Step 5: 全テストと型チェック**

Run: `npm test && npx tsc --noEmit`
Expected: 全テストPASS、型エラーなし

- [ ] **Step 6: 手動で通し確認**

Run: `npm run dev`
Expected:
- ピースをドラッグして盤に配置、R/Fで回転・反転できる。
- 12ピースを敷き詰めると完成ダイアログが出て「新発見！ / N通り中M通り発見」。
- 「図鑑を見る」で発見済み解のサムネ一覧と発見数が見える。
- リロードしても進行中の盤と図鑑が復元される。

- [ ] **Step 7: コミット**

```bash
git add src/App.tsx src/main.tsx src/components/Collection.tsx src/components/Controls.tsx src/styles.css
git commit -m "feat: integrate collection view, controls, and drag ghost into app"
```

---

## 実装後の確認事項(全タスク完了時)

- `npm test` 全通過、`npx tsc --noEmit` エラーなし。
- スペックの各要件にタスクが対応していること(下記セルフレビュー参照)。
- メーカー名・商品名がコード/UI/コミット履歴に含まれないこと。
