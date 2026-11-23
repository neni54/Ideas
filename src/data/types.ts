export type LevelKind = 'normal' | 'timed' | 'chest' | 'boss';
export type ExerciseType = 'choice' | 'build' | 'fill' | 'dialogue';

export interface Phrase {
  id: string;
  en: string;
  /** Spanish translation. The [key] word is the one hidden in "fill" exercises. */
  es: string;
  tip: string;
  /** Hand-written wrong translations (false friends, wrong tense...). */
  traps?: string[];
}

export interface Level {
  id: string;
  n: number;
  title: string;
  story: string;
  goal: string;
  character: string;
  kind: LevelKind;
  phrases: Phrase[];
  boss?: { name: string; hp: number; taunt: string; defeat: string };
}

export interface World {
  id: string;
  name: string;
  subtitle: string;
  levels: Level[];
}
