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
