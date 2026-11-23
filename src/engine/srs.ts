// Leitner-style spaced repetition for failed phrases ("Ecos").

export interface SrsCard {
  box: number; // 0..4, at 5 the phrase is mastered and removed
  due: number; // timestamp (ms)
  fails: number;
}

const H = 3600_000;
export const INTERVALS = [0, 4 * H, 24 * H, 72 * H, 168 * H];
export const MASTER_BOX = 5;

export function onFail(card: SrsCard | undefined, now: number): SrsCard {
  return { box: 0, due: now, fails: (card?.fails ?? 0) + 1 };
}

/** Returns the updated card, or null when the phrase is mastered. */
export function onSuccess(card: SrsCard, now: number): SrsCard | null {
  const box = card.box + 1;
  if (box >= MASTER_BOX) return null;
  return { ...card, box, due: now + INTERVALS[box] };
}

export function dueIds(srs: Record<string, SrsCard>, now: number): string[] {
  return Object.entries(srs)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([id]) => id);
}

export function nextDue(srs: Record<string, SrsCard>): number | null {
  const times = Object.values(srs).map((c) => c.due);
  return times.length ? Math.min(...times) : null;
}
