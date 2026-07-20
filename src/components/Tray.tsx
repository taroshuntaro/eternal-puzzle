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
