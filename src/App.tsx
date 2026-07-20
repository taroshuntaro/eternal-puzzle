import { useRef, useState } from 'react';
import { GameProvider } from './state/GameContext';
import { Board } from './components/Board';
import { Tray } from './components/Tray';
import { Controls } from './components/Controls';
import { Collection } from './components/Collection';
import { StorageNotice } from './components/StorageNotice';
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
  const { drag, startDrag, preview } = useDragController(boardRef, CELL);
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
      <StorageNotice />
      <Controls view={view} onToggleView={() => setView(view === 'play' ? 'collection' : 'play')} />
      {view === 'play' ? (
        <>
          <Board cellSize={CELL} boardRef={boardRef} onCellPointerDown={onCellPointerDown} preview={preview} />
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
