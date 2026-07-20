import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { addSolution } from '../storage/collection';
import { TOTAL_SOLUTIONS } from '../puzzle/solution';
import { PIECE_IDS } from '../puzzle/pieces';
import { Collection } from './Collection';

beforeEach(() => localStorage.clear());

describe('Collection', () => {
  it('shows the found count out of the total', () => {
    addSolution(PIECE_IDS.join('').repeat(5));
    render(<Collection />);
    expect(screen.getByText(new RegExp(`${TOTAL_SOLUTIONS}`))).toBeTruthy();
    expect(screen.getByText(/1通り発見/)).toBeTruthy();
  });
});
