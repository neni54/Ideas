export const xpToNext = (level: number) => 80 + 40 * (level - 1);

export function levelFromXp(xp: number) {
  let level = 1;
  let rest = xp;
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, need: xpToNext(level) };
}

export const starsFor = (accuracy: number) => (accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1);

export const XP_CORRECT = 10;
export const XP_COMBO_BONUS = 2;
export const COINS_CORRECT = 3;

/** Accuracy band of the last answers → difficulty 0 (easy), 1 (normal), 2 (hard). */
export function difficulty(recent: boolean[]): 0 | 1 | 2 {
  if (recent.length < 8) return 1;
  const acc = recent.filter(Boolean).length / recent.length;
  return acc < 0.6 ? 0 : acc > 0.85 ? 2 : 1;
}
