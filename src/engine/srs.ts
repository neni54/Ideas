// Spaced repetition (Leitner boxes). Every expression you meet becomes a card in your phrasebook.

export interface Card {
  box: number; // 0..5 — 5 means mastered
  due: number;
  seen: number;
  right: number;
  wrong: number;
  first: number;
  fav?: boolean;
}

const MIN = 60_000;
const DAY = 86_400_000;
/** Wait before the next review, indexed by box. */
export const INTERVALS = [10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 45 * DAY];
export const MASTER_BOX = 5;

export const newCard = (now: number): Card => ({ box: 0, due: now, seen: 0, right: 0, wrong: 0, first: now });

/** In-game answer. A right answer only promotes the card when it was due (no cramming). */
export function onAnswer(card: Card | undefined, correct: boolean, now: number): Card {
  const c = { ...(card ?? newCard(now)) };
  const wasNew = c.seen === 0;
  c.seen++;
  if (correct) {
    c.right++;
    if (wasNew || c.due <= now) {
      c.box = Math.min(MASTER_BOX, c.box + 1);
      c.due = now + INTERVALS[c.box];
    }
  } else {
    c.wrong++;
    c.box = 0;
    c.due = now; // straight to Memory
  }
  return c;
}

/** Self-assessment in Memory mode: 0 = no idea, 1 = hard, 2 = knew it. */
export function onGrade(card: Card, grade: 0 | 1 | 2, now: number): Card {
  const c = { ...card, seen: card.seen + 1 };
  if (grade === 0) {
    c.box = 0;
    c.wrong++;
    c.due = now + INTERVALS[0];
  } else if (grade === 1) {
    c.box = Math.max(1, Math.min(c.box, 2));
    c.right++;
    c.due = now + INTERVALS[1];
  } else {
    c.right++;
    // Only a due card moves up a box: reviewing early does not count as spacing.
    if (card.due <= now) {
      c.box = Math.min(MASTER_BOX, c.box + 1);
      c.due = now + INTERVALS[c.box];
    }
  }
  return c;
}

export function dueIds(cards: Record<string, Card>, now: number): string[] {
  return Object.entries(cards)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([id]) => id);
}

export const masteredCount = (cards: Record<string, Card>) => Object.values(cards).filter((c) => c.box >= MASTER_BOX).length;
