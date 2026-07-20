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
