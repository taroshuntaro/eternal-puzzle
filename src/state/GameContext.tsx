import { createContext, useContext, useEffect, useReducer } from 'react';
import {
  gameReducer, initialState, toPlacements, type GameState, type Action,
} from './gameReducer';
import { loadProgress, saveProgress } from '../storage/collection';
import { PIECE_IDS, getPiece, type PieceId } from '../puzzle/pieces';
import { isLegal } from '../puzzle/board';

type GameContextValue = { state: GameState; dispatch: React.Dispatch<Action> };

const GameContext = createContext<GameContextValue | null>(null);

// 保存状態が構造的に妥当か検証する。1つでも壊れていれば復帰しない。
function isValidGameState(saved: unknown): saved is GameState {
  if (!saved || typeof saved !== 'object') return false;
  const s = saved as GameState;
  if (!s.pieces || typeof s.pieces !== 'object') return false;
  for (const id of PIECE_IDS) {
    const p = s.pieces[id];
    if (!p || typeof p.orientation !== 'number' || !p.position) return false;
    // orientation は実在する向きを指すインデックスでなければならない。
    // 範囲外だと placedCells が orientations[idx]=undefined に .map して落ちる。
    if (!Number.isInteger(p.orientation)
      || p.orientation < 0
      || p.orientation >= getPiece(id).orientations.length) return false;
    if (p.position.kind === 'board') {
      const a = p.position.anchor;
      if (!a || typeof a.r !== 'number' || typeof a.c !== 'number') return false;
    } else if (p.position.kind !== 'tray') {
      return false;
    }
  }
  if (s.selected !== null && !PIECE_IDS.includes(s.selected as PieceId)) return false;
  return true;
}

// 復帰した盤が実際に合法(盤内・重なりなし)かを検証する。isLegal は対象ピース自身を除外して判定する。
function isLegalBoard(state: GameState): boolean {
  const placements = toPlacements(state);
  for (const p of Object.values(placements)) {
    if (p && !isLegal(placements, p)) return false;
  }
  return true;
}

function initFromStorage(): GameState {
  const saved = loadProgress();
  if (isValidGameState(saved) && isLegalBoard(saved)) return saved;
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
