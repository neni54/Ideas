import type { ExerciseType, Phrase } from '../data/types';
import { shuffle } from './date';

export interface Exercise {
  uid: string;
  type: ExerciseType;
  phrase: Phrase;
  isEcho: boolean;
  isRetry: boolean;
  /** Correct answer in display form. */
  answer: string;
  options?: string[];
  tokens?: string[];
  blank?: { before: string; after: string };
  speaker?: string;
}

export const plain = (es: string) => es.replace(/\[|\]/g, '');
export const keyWord = (es: string) => es.match(/\[([^\]]+)\]/)?.[1] ?? '';

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[¡!¿?.,;:"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const sameAnswer = (a: string, b: string) => normalize(a) === normalize(b);

let uidCounter = 0;
const uid = () => `ex${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

function pickDistinct(candidates: string[], exclude: string[], n: number): string[] {
  const seen = new Set(exclude.map(normalize));
  const out: string[] = [];
  for (const c of shuffle(candidates)) {
    const k = normalize(c);
    if (seen.has(k) || !k) continue;
    seen.add(k);
    out.push(c);
    if (out.length === n) break;
  }
  return out;
}

export function makeExercise(
  type: ExerciseType,
  phrase: Phrase,
  pool: Phrase[],
  opts: { difficulty: 0 | 1 | 2; isEcho?: boolean; isRetry?: boolean; speaker?: string },
): Exercise {
  const answer = plain(phrase.es);
  const others = pool.filter((p) => p.id !== phrase.id);
  const base = {
    uid: uid(),
    type,
    phrase,
    isEcho: !!opts.isEcho,
    isRetry: !!opts.isRetry,
    answer,
    speaker: opts.speaker,
  };
  const nOptions = opts.difficulty === 0 ? 3 : 4;

  if (type === 'choice' || type === 'dialogue') {
    // Prefer phrases of similar length: they look more plausible.
    const len = answer.length;
    const sorted = others
      .map((p) => plain(p.es))
      .sort((a, b) => Math.abs(a.length - len) - Math.abs(b.length - len))
      .slice(0, 8);
    const traps = pickDistinct(phrase.traps ?? [], [answer], 2);
    const fill = pickDistinct(sorted, [answer, ...traps], nOptions - 1 - traps.length);
    return { ...base, options: shuffle([answer, ...traps, ...fill]) };
  }

  if (type === 'fill') {
    const key = keyWord(phrase.es);
    const [before, after] = phrase.es.split(`[${key}]`);
    const otherKeys = others.map((p) => keyWord(p.es)).filter(Boolean);
    const distractors = pickDistinct(otherKeys, [key], nOptions - 1);
    return { ...base, answer: key, blank: { before, after }, options: shuffle([key, ...distractors]) };
  }

  // build
  const words = answer.split(' ');
  const decoyCount = opts.difficulty === 2 ? 2 : opts.difficulty === 1 ? 1 : 0;
  const otherWords = others.flatMap((p) => plain(p.es).split(' ')).filter((w) => w.length > 2);
  const decoys = pickDistinct(otherWords, words, decoyCount);
  let tokens = shuffle([...words, ...decoys]);
  for (let i = 0; i < 5 && tokens.join(' ') === answer; i++) tokens = shuffle(tokens);
  return { ...base, tokens };
}
