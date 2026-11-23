import type { Cefr } from '../data/types';

export const xpToNext = (level: number) => 150 + 75 * (level - 1);

export function levelFromXp(xp: number) {
  let level = 1;
  let rest = xp;
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, need: xpToNext(level) };
}

export const XP_BY_LEVEL: Record<Cefr, number> = { B1: 10, B2: 12, C1: 15 };
export const XP_COMBO_BONUS = 3;
export const XP_RETRY = 4;

/** Accuracy over the last answers → 0 (easier), 1 (normal), 2 (harder). */
export function difficulty(recent: boolean[]): 0 | 1 | 2 {
  if (recent.length < 8) return 1;
  const acc = recent.filter(Boolean).length / recent.length;
  return acc < 0.6 ? 0 : acc > 0.85 ? 2 : 1;
}
