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
