import { awkward, friends, idioms, passive, slang } from './packs/b';
import { dating, everyday, meant, office, sarcasm } from './packs/a';
import { maincharacter, plottwists, popculture, redflags, twoam } from './packs/c';
import type { Expression, Pack } from './types';

/** Add a new phrase pack: create it in packs/ and list it here. Nothing else changes. */
export const PACKS: Pack[] = [
  everyday, sarcasm, dating, meant, office, friends, awkward, idioms, passive, slang, redflags, twoam, maincharacter, popculture, plottwists,
].sort((a, b) => a.vol - b.vol);

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
