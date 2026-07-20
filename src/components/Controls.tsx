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
