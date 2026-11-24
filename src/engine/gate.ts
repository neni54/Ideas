// Progression gate: learning is continuous; only a session with 3+ mistakes pauses NEW content
// until the next local calendar day, and the next day starts by reviewing what was missed.
import type { Card } from './srs';
import { MASTER_BOX } from './srs';

export const MISTAKE_LIMIT = 3;

/** Sessions that teach (and can therefore trigger the review rule). Memory and Quick Fire are drills. */
export const LEARNING_RUNS = ['daily', 'episode', 'practice', 'twist', 'voice'] as const;

export interface ReviewLock {
  /** Local calendar day (YYYY-MM-DD) on which the 3-mistake session happened. */
  day: string;
  /** Every expression missed in the triggering session(s). */
  ids: string[];
  /** Missed expressions not yet reviewed successfully on a later day. */
  pending: string[];
  /** Mistakes counted in the session that triggered the lock (max of the day). */
  mistakes: number;
}

export type GateState = 'open' | 'locked-today' | 'review-first';

export interface Gate {
  state: GateState;
  /** May the user start sessions that introduce expressions they have never seen? */
  canLearnNew: boolean;
  pending: string[];
  /** True when new content is open only because of an EXTRA CHANCE bought with a token. */
  extra?: boolean;
}

/** EXTRA CHANCE (SIDEYE TOKENS): lessons bought today to continue after the 3-mistake lock. */
export interface ExtraChance {
  /** Local day the chances were bought for. They only apply on that day. */
  day: string;
  /** Extra lessons still available today. */
  left: number;
}

/**
 * `today` is the user's LOCAL calendar day (YYYY-MM-DD). Days compare as strings, so the
 * reset happens at local midnight, not 24 h after the mistakes, and survives reloads.
 */
export function gateFor(lock: ReviewLock | null, today: string): Gate {
  if (!lock) return { state: 'open', canLearnNew: true, pending: [] };
  // Same day (or a clock that went backwards): new content waits until tomorrow.
  if (today <= lock.day) return { state: 'locked-today', canLearnNew: false, pending: lock.pending };
  if (lock.pending.length) return { state: 'review-first', canLearnNew: false, pending: lock.pending };
  return { state: 'open', canLearnNew: true, pending: [] };
}

/**
 * The same gate, plus EXTRA CHANCE: on the day of a 3-mistake lock, a bought chance opens new
 * content for one more lesson. It never touches the lock itself (mistakes, pending reviews,
 * tomorrow's review), only whether this next lesson may include new expressions.
 */
export function gateWithChance(lock: ReviewLock | null, today: string, chance: ExtraChance | null | undefined): Gate {
  const g = gateFor(lock, today);
  if (g.state === 'locked-today' && chance && chance.day === today && chance.left > 0) return { ...g, canLearnNew: true, extra: true };
  return g;
}

/** Applies the result of a learning session. Mistakes are distinct expressions missed on a first try. */
export function afterSession(lock: ReviewLock | null, today: string, missed: string[]): ReviewLock | null {
  const unique = [...new Set(missed)];
  if (unique.length < MISTAKE_LIMIT) return lock;
  if (lock && lock.day === today) {
    return {
      day: today,
      ids: [...new Set([...lock.ids, ...unique])],
      pending: [...new Set([...lock.pending, ...unique])],
      mistakes: Math.max(lock.mistakes, unique.length),
    };
  }
  // A new lock keeps any review still owed from an earlier day.
  const owed = lock ? lock.pending : [];
  return { day: today, ids: unique, pending: [...new Set([...owed, ...unique])], mistakes: unique.length };
}

/** A successful review on a LATER day clears that expression from the pending list. */
export function afterReview(lock: ReviewLock | null, today: string, id: string): ReviewLock | null {
  if (!lock || today <= lock.day || !lock.pending.includes(id)) return lock;
  const pending = lock.pending.filter((p) => p !== id);
  return pending.length ? { ...lock, pending } : null;
}

/** Drops a lock that no longer restricts anything (new day and nothing pending). */
export function settle(lock: ReviewLock | null, today: string): ReviewLock | null {
  return lock && today > lock.day && lock.pending.length === 0 ? null : lock;
}

/** Local midnight that starts the next calendar day (DST-safe: lets Date do the calendar maths). */
export function nextLocalMidnight(now = new Date()): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export type LearningStatus = 'new' | 'learning' | 'review' | 'mastered';

export function statusOf(card: Card | undefined, now = Date.now()): LearningStatus {
  if (!card) return 'new';
  if (card.box >= MASTER_BOX) return 'mastered';
  if (card.box === 0 || card.due <= now) return 'review';
  return 'learning';
}

export const STATUS_LABEL: Record<LearningStatus, string> = {
  new: 'Nueva',
  learning: 'Aprendiendo',
  review: 'Necesita repaso',
  mastered: 'Dominada',
};
