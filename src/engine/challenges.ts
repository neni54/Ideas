import { ALL, PACK_BY_ID, chunkOf, lineOf, plain } from '../data/content';
import { INTENTS, type Mode } from '../data/meta';
import type { Expression } from '../data/types';
import { shuffle } from './date';

export type OptionKind = 'right' | 'literal' | 'calque' | 'wrong';

export interface Option {
  value: string;
  text: string;
  kind: OptionKind;
}

export interface Challenge {
  uid: string;
  mode: Exclude<Mode, 'quickfire' | 'memory' | 'twist' | 'voice'>;
  x: Expression;
  options: Option[];
  isReview?: boolean;
  isRetry?: boolean;
  isSurprise?: boolean;
}

let n = 0;
const uid = () => `c${Date.now().toString(36)}${(n++).toString(36)}`;

const opt = (text: string, kind: OptionKind, value = text): Option => ({ text, kind, value });

/** Another expression from the same pack, for extra distractors. */
function sibling(x: Expression): Expression | undefined {
  const others = PACK_BY_ID[x.pack].expressions.filter((e) => e.id !== x.id);
  return others[Math.floor(Math.random() * others.length)];
}

export function makeChallenge(mode: Challenge['mode'], x: Expression, diff: 0 | 1 | 2, flags: Partial<Challenge> = {}): Challenge {
  let options: Option[];
  switch (mode) {
    case 'meaning':
      options = [opt(x.gist, 'right'), opt(x.literal, 'literal'), opt(x.wrong[0], 'wrong'), opt(x.wrong[1], 'wrong')];
      if (diff === 0) options.splice(3, 1);
      break;
    case 'detective': {
      const s = sibling(x);
      options = [opt(x.gist, 'right'), opt(x.wrong[0], 'wrong'), opt(x.wrong[1], 'wrong')];
      if (s && diff > 0) options.push(opt(s.gist, 'wrong'));
      break;
    }
    case 'sarcasm': {
      const count = diff === 0 ? 4 : diff === 2 ? 6 : 5;
      const others = shuffle(INTENTS.filter((i) => i.id !== x.intent)).slice(0, count - 1);
      const right = INTENTS.find((i) => i.id === x.intent)!;
      options = [opt(right.label, 'right', right.id), ...others.map((i) => opt(i.label, 'wrong', i.id))];
      // Keep a stable reading order for tone chips.
      const order = INTENTS.map((i) => i.id);
      return { uid: uid(), mode, x, options: options.sort((a, b) => order.indexOf(a.value as never) - order.indexOf(b.value as never)), ...flags };
    }
    case 'natural':
      options = [opt(plain(x.en), 'right'), opt(x.calques[0], 'calque'), opt(x.calques[1], 'calque')];
      break;
    case 'reply':
      options = [opt(plain(lineOf(x)), 'right'), opt(x.cue[1], 'calque'), opt(x.cue[2], 'calque')];
      break;
    case 'complete': {
      options = [opt(chunkOf(x.en), 'right'), opt(x.chunkWrong[0], 'calque'), opt(x.chunkWrong[1], 'calque')];
      const s = sibling(x);
      if (s && diff > 0) options.push(opt(chunkOf(s.en), 'wrong'));
      break;
    }
    case 'battle':
      options = [opt(plain(x.en), 'right'), opt(x.battle[1], 'wrong')];
      break;
  }
  // De-duplicate (rare data overlaps) and shuffle.
  const seen = new Set<string>();
  options = options.filter((o) => (seen.has(o.value.toLowerCase()) ? false : (seen.add(o.value.toLowerCase()), true)));
  return { uid: uid(), mode, x, options: shuffle(options), ...flags };
}

/** A retry uses a different mode, so it is understanding, not memorising a button. */
export function retryOf(c: Challenge, diff: 0 | 1 | 2): Challenge {
  const alt: Record<Challenge['mode'], Challenge['mode']> = {
    meaning: 'natural',
    detective: 'meaning',
    sarcasm: 'meaning',
    natural: 'complete',
    reply: 'meaning',
    complete: 'natural',
    battle: 'meaning',
  };
  return makeChallenge(alt[c.mode], c.x, Math.min(diff, 1) as 0 | 1, { isRetry: true, isReview: c.isReview });
}

export const isRight = (o: Option) => o.kind === 'right';
export const expression = (id: string) => ALL[id];
