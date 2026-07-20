import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { loadCollection } from '../storage/collection';
import { canonicalKey } from '../puzzle/solution';
import { SolvedDialog } from './SolvedDialog';
import { GameProvider } from '../state/GameContext';

beforeEach(() => localStorage.clear());

describe('SolvedDialog', () => {
  it('renders nothing when the board is not solved', () => {
    const { container } = render(
      <GameProvider>
        <SolvedDialog />
      </GameProvider>,
    );
    // 未完成なのでダイアログのroleは存在しない
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container).toBeTruthy();
  });

  it('canonicalKey is stable (guard for dialog dedup logic)', () => {
    const a = new Array(60).fill('A');
    expect(canonicalKey(a as any)).toBe(canonicalKey(a as any));
    expect(loadCollection()).toEqual([]);
  });
});
