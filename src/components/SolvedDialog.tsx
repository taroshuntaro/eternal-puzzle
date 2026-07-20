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
