// SIDEYE TOKENS: rules shared by the store and the UI. Pure functions, easy to test.
import type { Run } from '../store/game';

/** Price list. Tokens can never be bought with money. */
export const EXTRA_CHANCE_PRICE = 1;
/** Default badge price (each collection/badge in src/badges sets its own). */
export const BADGE_PRICE = 10;

/** Lessons that pay a token when completed with zero mistakes. */
export const TOKEN_RUNS = ['daily', 'episode'] as const;

export interface TokenMove {
  /** Unique id of the movement (also prevents double entries). */
  id: string;
  at: number;
  /** +1 for a perfect lesson, -1 for an extra chance, -10 for a badge, +n for a refund. */
  delta: number;
  reason: string;
}

/** Short stable hash (FNV-1a) used to identify a lesson by its content. */
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Identifier of a lesson for rewards. A collection episode is the same lesson every time it is
 * replayed; a daily lesson is identified by the exact set of expressions it contained.
 * null = this kind of session does not pay tokens.
 */
export function lessonKey(run: Run, ids: string[] | undefined): string | null {
  if (run.kind === 'episode') return `episode:${run.packId}`;
  if (run.kind === 'daily') return ids?.length ? `daily:${hash([...new Set(ids)].sort().join('|'))}` : null;
  return null;
}

/** A lesson is perfect when every question was right on the first try (no mistakes at all). */
export function isPerfect(sum: { total: number; firstTry: number; mistakes?: string[]; missedIds?: string[] }) {
  return sum.total > 0 && sum.firstTry === sum.total && !(sum.mistakes?.length ?? 0) && !(sum.missedIds?.length ?? 0);
}
