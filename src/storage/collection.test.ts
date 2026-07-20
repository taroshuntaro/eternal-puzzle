import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCollection, addSolution, loadProgress, saveProgress, clearProgress,
} from './collection';

beforeEach(() => {
  localStorage.clear();
});

describe('collection storage', () => {
  it('starts empty', () => {
    expect(loadCollection()).toEqual([]);
  });

  it('adds a new solution', () => {
    const res = addSolution('AAAAA', 1000);
    expect(res.added).toBe(true);
    expect(res.collection).toHaveLength(1);
    expect(res.collection[0]).toEqual({ key: 'AAAAA', foundAt: 1000 });
    expect(loadCollection()).toHaveLength(1);
  });

  it('does not double-count the same key', () => {
    addSolution('AAAAA', 1000);
    const res = addSolution('AAAAA', 2000);
    expect(res.added).toBe(false);
    expect(res.collection).toHaveLength(1);
  });

  it('persists progress round-trip', () => {
    saveProgress({ hello: 'world' });
    expect(loadProgress()).toEqual({ hello: 'world' });
    clearProgress();
    expect(loadProgress()).toBeNull();
  });

  it('returns empty collection when stored data is corrupt', () => {
    localStorage.setItem('eternal-puzzle:pentomino:collection', 'not json');
    expect(loadCollection()).toEqual([]);
  });

  it('does not throw when saving a non-serializable value', () => {
    const circular: any = {};
    circular.self = circular;
    expect(() => saveProgress(circular)).not.toThrow();
  });

  it('returns null when stored progress is corrupt', () => {
    localStorage.setItem('eternal-puzzle:pentomino:progress', 'not json');
    expect(loadProgress()).toBeNull();
  });
});
