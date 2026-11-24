import { awkward, friends, idioms, passive, slang } from './packs/b';
import { dating, everyday, meant, office, sarcasm } from './packs/a';
import { maincharacter, plottwists, popculture, redflags, twoam } from './packs/c';
import { hello, please, feelings, questions, yesno, outandabout } from './packs/firststeps';
import { smalltalk, reactions, plans, manners } from './packs/comfortable';
import { tierOf } from './levels';
import type { Expression, Pack, Tier } from './types';

/** The SIDEYE level of a pack: the level most of its expressions have (ties → easier). */
function packTier(p: Pack): Tier {
  const n = [0, 0, 0, 0, 0, 0];
  p.expressions.forEach((x) => n[tierOf(x)]++);
  return ([1, 2, 3, 4, 5] as Tier[]).reduce((best, t) => (n[t] > n[best] ? t : best), 1 as Tier);
}

/**
 * Add a new phrase pack: create it in packs/ and list it here. Nothing else changes.
 * Packs are ordered from FIRST STEPS to THINK IN ENGLISH and numbered in that order.
 * Every expression gets its resolved `tier`.
 */
const RAW_PACKS: Pack[] = [
  hello, please, feelings, questions, yesno, outandabout,
  smalltalk, reactions, plans, manners,
  everyday, sarcasm, dating, meant, office, friends, awkward, idioms, passive, slang, redflags, twoam, maincharacter, popculture, plottwists,
];
export const PACKS: (Pack & { tier: Tier })[] = RAW_PACKS.map((p, i) => ({
  ...p,
  tier: packTier(p),
  order: i,
  expressions: p.expressions.map((x) => ({ ...x, tier: tierOf(x) })),
}))
  .sort((a, b) => a.tier - b.tier || a.order - b.order)
  .map((p, i) => ({ ...p, vol: i + 1 }));

export const ALL: Record<string, Expression> = Object.fromEntries(PACKS.flatMap((p) => p.expressions.map((x) => [x.id, x])));
export const ALL_LIST: Expression[] = Object.values(ALL);
export const PACK_BY_ID: Record<string, Pack> = Object.fromEntries(PACKS.map((p) => [p.id, p]));

/** English without the [chunk] markers. */
export const plain = (en: string) => en.replace(/\[|\]/g, '');
/** The line as said in the scene / as a reply to the cue. */
export const lineOf = (x: { en: string; reply?: string }) => x.reply ?? x.en;
export const chunkOf = (en: string) => en.match(/\[([^\]]+)\]/)?.[1] ?? '';
export const splitChunk = (en: string) => {
  const c = chunkOf(en);
  const [before, after] = en.split(`[${c}]`);
  return { before, chunk: c, after };
};
