// Review items that are not phrase-pack expressions: Twist scenes and Voice Acting rounds.
// They live in the same spaced-repetition system (store.extra) and the same three-mistake rule.
import { ALL, plain } from './content';
import type { Cefr } from './types';
import { SCENE_BY_ID } from './twists';
import { parseRound } from './voiceacting';
import type { Tone } from '../services/api';

export type ItemKind = 'expression' | 'twist' | 'voice';

export const kindOf = (id: string): ItemKind | null => (ALL[id] ? 'expression' : SCENE_BY_ID[id] ? 'twist' : parseRound(id) ? 'voice' : null);
export const isExtra = (id: string) => kindOf(id) === 'twist' || kindOf(id) === 'voice';

/** One line for lists (results, review notes). */
export function describe(id: string): { en: string; es: string; kind: ItemKind } | null {
  const x = ALL[id];
  if (x) return { en: plain(x.en), es: x.gist, kind: 'expression' };
  const t = SCENE_BY_ID[id];
  if (t) return { en: t.twist[1], es: t.options[t.answer], kind: 'twist' };
  const r = parseRound(id);
  if (r) return { en: `“${r.line.text}” · ${r.delivery.intent}`, es: r.delivery.es, kind: 'voice' };
  return null;
}

/** What a Memory flashcard needs, whatever the source. */
export interface MemoryItem {
  id: string;
  kind: ItemKind;
  level: Cefr;
  /** Front: English (may contain [chunk] markers for expressions). */
  front: string;
  /** Front context line (optional). */
  hint: string;
  /** Back: the meaning. */
  back: string;
  /** Back: short explanation. */
  note: string;
  ex?: [string, string];
  /** Audio for the front. */
  audio: { text: string; tone: Tone };
}

export function memoryItem(id: string, toneFor: (id: string) => Tone): MemoryItem | null {
  const x = ALL[id];
  if (x)
    return {
      id, kind: 'expression', level: x.level, front: x.en, hint: '¿Qué significa y cuándo lo usarías? Piénsalo, luego toca para girar.',
      back: x.es, note: x.gist, ex: x.ex, audio: { text: plain(x.en), tone: toneFor(id) },
    };
  const t = SCENE_BY_ID[id];
  if (t)
    return {
      id, kind: 'twist', level: t.level, front: t.twist[1], hint: `${t.setting} ¿Qué quiere decir de verdad?`,
      back: t.options[t.answer], note: t.explain, ex: t.ex, audio: { text: t.key, tone: t.tone },
    };
  const r = parseRound(id);
  if (r)
    return {
      id, kind: 'voice', level: r.line.level, front: r.line.text, hint: 'Escúchala. ¿Qué intención transmite esta forma de decirlo?',
      back: `${r.delivery.intent} · ${r.delivery.es}`, note: r.delivery.explain, audio: { text: r.line.text, tone: r.delivery.tone },
    };
  return null;
}
