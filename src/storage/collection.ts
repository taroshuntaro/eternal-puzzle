export type FoundSolution = { key: string; foundAt: number };

const COLLECTION_KEY = 'eternal-puzzle:pentomino:collection';
const PROGRESS_KEY = 'eternal-puzzle:pentomino:progress';
const VERSION = 1;

type CollectionFile = { version: number; solutions: FoundSolution[] };

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage無効/容量超過時はメモリ内動作にフォールバック(保存しない)
  }
}

export function loadCollection(): FoundSolution[] {
  const raw = safeGet(COLLECTION_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CollectionFile;
    if (!parsed || !Array.isArray(parsed.solutions)) return [];
    return parsed.solutions;
  } catch {
    return [];
  }
}

export function addSolution(
  key: string,
  now: number = Date.now(),
): { added: boolean; collection: FoundSolution[] } {
  const current = loadCollection();
  if (current.some((s) => s.key === key)) {
    return { added: false, collection: current };
  }
  const next = [...current, { key, foundAt: now }];
  const file: CollectionFile = { version: VERSION, solutions: next };
  safeSet(COLLECTION_KEY, JSON.stringify(file));
  return { added: true, collection: next };
}

export function loadProgress(): unknown | null {
  const raw = safeGet(PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProgress(state: unknown): void {
  try {
    safeSet(PROGRESS_KEY, JSON.stringify(state));
  } catch {
    // 直列化できない値などはthrowせず黙って無視する
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // 何もしない
  }
}

export function isPersistenceAvailable(): boolean {
  const testKey = 'eternal-puzzle:__test__';
  try {
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
