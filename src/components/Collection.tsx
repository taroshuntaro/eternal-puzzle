import { useState } from 'react';
import { loadCollection } from '../storage/collection';
import { TOTAL_SOLUTIONS } from '../puzzle/solution';
import { COLS } from '../puzzle/board';
import { PIECE_IDS, getPiece, type PieceId } from '../puzzle/pieces';

// 破損したキーなど未知の文字が混じっていてもクラッシュしないように防御的に色を引く
function colorFor(id: string): string {
  return (PIECE_IDS as string[]).includes(id) ? getPiece(id as PieceId).color : '#888';
}

function SolutionGridView({ solutionKey, cell }: { solutionKey: string; cell: number }) {
  // canonicalKeyは正規化後の行優先PieceId列(長さ60)
  const ids = solutionKey.split('');
  return (
    <div className="thumb" style={{ gridTemplateColumns: `repeat(${COLS}, ${cell}px)` }}>
      {ids.map((id, i) => (
        <div key={i} style={{ width: cell, height: cell, background: colorFor(id) }} />
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
