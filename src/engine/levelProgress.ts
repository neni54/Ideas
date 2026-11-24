// The player's English level: the first SIDEYE level whose phrases are not yet 80 % met.
import { ALL_LIST } from '../data/content';
import { LEVELS, tierOf } from '../data/levels';
import type { Tier } from '../data/types';
import type { Card } from './srs';

export interface LevelStat {
  tier: Tier;
  total: number;
  seen: number;
  mastered: number;
}

export function levelStats(cards: Record<string, Card>): LevelStat[] {
  return LEVELS.map((l) => {
    const xs = ALL_LIST.filter((x) => tierOf(x) === l.tier);
    return { tier: l.tier, total: xs.length, seen: xs.filter((x) => cards[x.id]).length, mastered: xs.filter((x) => (cards[x.id]?.box ?? 0) >= 3).length };
  });
}

export const LEVEL_DONE = 0.8;

export function currentLevel(cards: Record<string, Card>): LevelStat {
  const stats = levelStats(cards);
  return stats.find((s) => s.seen / Math.max(1, s.total) < LEVEL_DONE) ?? stats[stats.length - 1];
}
