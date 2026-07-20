import { useState } from 'react';
import { isPersistenceAvailable } from '../storage/collection';

export function StorageNotice() {
  const [available] = useState(() => isPersistenceAvailable());
  const [dismissed, setDismissed] = useState(false);
  if (available || dismissed) return null;
  return (
    <div className="notice" role="status">
      <span>
        この環境では保存ができません(プライベートモードや容量超過の可能性)。
        図鑑や進行状況はページを閉じると失われます。
      </span>
      <button onClick={() => setDismissed(true)}>閉じる</button>
    </div>
  );
}
