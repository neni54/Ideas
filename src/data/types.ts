export type Cefr = 'B1' | 'B2' | 'C1';

export type Intent = 'sincere' | 'sarcastic' | 'passive-aggressive' | 'annoyed' | 'joking' | 'flirty' | 'evasive';

export type Tag =
  | 'informal'
  | 'slang'
  | 'idiom'
  | 'phrasal'
  | 'sarcastic'
  | 'humorous'
  | 'rude'
  | 'flirty'
  | 'polite'
  | 'work'
  | 'passive-aggressive';

/**
 * One expression = one teachable unit. Every game mode is generated from these fields,
 * so a new phrase pack only needs data, never code.
 */
export interface Expression {
  id: string;
  pack: string;
  /** English expression. The [bracketed] chunk is the part hidden in "Complete the conversation". */
  en: string;
  /** Optional version of `en` that answers `cue[0]` and fits `scene` (same [chunk]). */
  reply?: string;
  /** Natural Spanish (Spain) translation. */
  es: string;
  level: Cefr;
  tags: Tag[];
  /** When/where it is used. */
  context: string;
  /** Real meaning and nuance. */
  meaning: string;
  /** Typical mistake made by Spanish speakers. */
  mistake: string;
  /** Extra original example: [English, Spanish]. */
  ex: [string, string];
  /** One-line real meaning (Spanish), used as the right answer in meaning modes. */
  gist: string;
  /** Word-by-word misreading (Spanish). */
  literal: string;
  /** Plausible but wrong interpretations (Spanish). */
  wrong: [string, string];
  /** Tone in the scene below. */
  intent: Intent;
  /** Short situation (Spanish) that gives the line its context. */
  scene: string;
  /** [What someone says to you, unnatural reply, unnatural reply]. The right reply is `en`. */
  cue: [string, string, string];
  /** Near-miss versions of the [chunk]. */
  chunkWrong: [string, string];
  /** What a Spanish speaker would say translating word by word. */
  calques: [string, string];
  /** [Situation (Spanish), similar rival expression, the difference]. */
  battle: [string, string, string];
}

export interface Pack {
  id: string;
  vol: number;
  title: string;
  tagline: string;
  blurb: string;
  unlock: number;
  colors: [string, string];
  expressions: Expression[];
}

export type RawExpression = Omit<Expression, 'id' | 'pack'>;

export function pack(meta: Omit<Pack, 'expressions'>, raw: RawExpression[]): Pack {
  return { ...meta, expressions: raw.map((r, i) => ({ ...r, id: `${meta.id}-${i + 1}`, pack: meta.id })) };
}
