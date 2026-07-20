import { createContext, useContext, useEffect, useReducer } from 'react';
import {
  gameReducer, initialState, type GameState, type Action,
} from './gameReducer';
import { loadProgress, saveProgress } from '../storage/collection';
import { PIECE_IDS, type PieceId } from '../puzzle/pieces';

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

function initFromStorage(): GameState {
  const saved = loadProgress();
  return isValidGameState(saved) ? saved : initialState();
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
