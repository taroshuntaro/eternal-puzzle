import { describe, it, expect } from 'vitest';
import { cellFromPoint, anchorFrom } from './geometry';

describe('geometry', () => {
  it('maps a pixel point to a board cell', () => {
    const rect = { left: 100, top: 50 };
    expect(cellFromPoint(100, 50, rect, 40)).toEqual({ r: 0, c: 0 });
    expect(cellFromPoint(145, 95, rect, 40)).toEqual({ r: 1, c: 1 });
  });

  it('computes anchor so the grabbed cell lands on the hovered cell', () => {
    // orientation内で(1,2)のセルを掴み、盤の(3,4)にホバー -> anchorは(2,2)
    expect(anchorFrom({ r: 3, c: 4 }, { r: 1, c: 2 })).toEqual({ r: 2, c: 2 });
  });
});
