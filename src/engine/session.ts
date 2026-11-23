import type { ExerciseType, Level, Phrase } from '../data/types';
import { ALL_PHRASES, WORLD1, levelOfPhrase } from '../data/world1';
import { shuffle } from './date';
import { makeExercise, type Exercise } from './exercises';
import { dueIds, type SrsCard } from './srs';

const MAX_ECHOES_IN_LEVEL = 3;

function weightedType(weights: Partial<Record<ExerciseType, number>>): ExerciseType {
  const entries = Object.entries(weights) as [ExerciseType, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [t, w] of entries) {
    if ((r -= w) <= 0) return t;
  }
  return entries[0][0];
}

function typeWeights(level: Level, difficulty: 0 | 1 | 2) {
  if (level.kind === 'boss') return { build: 4, fill: 3, choice: 2, dialogue: 3 };
  if (level.n <= 2) return { choice: 5, fill: 2, build: 2, dialogue: 2 };
  if (difficulty === 0) return { choice: 5, fill: 2, build: 1, dialogue: 2 };
  if (difficulty === 2) return { choice: 1, fill: 3, build: 4, dialogue: 2 };
  return { choice: 3, fill: 3, build: 3, dialogue: 2 };
}

/** Distractor pool: the phrase's level plus its neighbours. */
export function poolFor(phrase: Phrase): Phrase[] {
  const lvl = levelOfPhrase(phrase.id) ?? WORLD1.levels[0];
  const idx = WORLD1.levels.indexOf(lvl);
  return WORLD1.levels
    .slice(Math.max(0, idx - 1), idx + 2)
    .flatMap((l) => l.phrases);
}

export function buildLevelSession(
  level: Level,
  srs: Record<string, SrsCard>,
  difficulty: 0 | 1 | 2,
  now = Date.now(),
): Exercise[] {
  const weights = typeWeights(level, difficulty);
  const speaker = level.character !== 'pip' ? level.character : undefined;
  let lastType: ExerciseType | null = null;

  const pick = (): ExerciseType => {
    let t = weightedType(weights);
    if (t === lastType) t = weightedType(weights); // avoid long runs of the same type
    if (t === 'dialogue' && !speaker) t = 'choice';
    lastType = t;
    return t;
  };

  const main = level.phrases.map((p, i) => {
    // Gentle start: the very first challenge of the game is always multiple choice.
    const type = level.n === 1 && i < 2 ? 'choice' : pick();
    return makeExercise(type, p, level.phrases, { difficulty, speaker });
  });

  const echoes = dueIds(srs, now)
    .filter((id) => !id.startsWith(level.id + '-') && ALL_PHRASES[id])
    .slice(0, level.kind === 'boss' ? 0 : MAX_ECHOES_IN_LEVEL)
    .map((id) => {
      const p = ALL_PHRASES[id];
      return makeExercise(Math.random() < 0.5 ? 'choice' : 'build', p, poolFor(p), {
        difficulty: Math.min(difficulty, 1) as 0 | 1,
        isEcho: true,
      });
    });

  // Spread echoes through the session (never as the very first challenge).
  const out = main.slice();
  echoes.forEach((e, i) => {
    const pos = Math.min(out.length, 2 + Math.floor(((i + 1) * out.length) / (echoes.length + 1)));
    out.splice(pos, 0, e);
  });
  return out;
}

export function buildEchoSession(srs: Record<string, SrsCard>, now = Date.now()): Exercise[] {
  const ids = dueIds(srs, now).filter((id) => ALL_PHRASES[id]).slice(0, 10);
  return shuffle(ids).map((id) => {
    const p = ALL_PHRASES[id];
    const types: ExerciseType[] = ['choice', 'build', 'fill'];
    return makeExercise(types[Math.floor(Math.random() * types.length)], p, poolFor(p), {
      difficulty: 1,
      isEcho: true,
    });
  });
}

export function retryOf(ex: Exercise, difficulty: 0 | 1 | 2): Exercise {
  // A retry uses a different (usually easier) format, so it is not pure memorisation.
  const type: ExerciseType = ex.type === 'build' ? 'choice' : 'build';
  return makeExercise(type, ex.phrase, poolFor(ex.phrase), {
    difficulty: Math.min(difficulty, 1) as 0 | 1,
    isEcho: ex.isEcho,
    isRetry: true,
  });
}
