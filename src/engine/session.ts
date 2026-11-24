import { ALL, ALL_LIST, PACKS, PACK_BY_ID, plain } from '../data/content';
import { IN_RUN_MODES, type Mode } from '../data/meta';
import type { Expression } from '../data/types';
import { makeChallenge, type Challenge } from './challenges';
import { seeded, shuffle } from './date';
import { dueIds, type Card } from './srs';

type Diff = 0 | 1 | 2;
type RunMode = Challenge['mode'];

const REVIEW_MODES: RunMode[] = ['meaning', 'natural', 'complete', 'reply'];
const pickMode = (modes: RunMode[], avoid?: RunMode) => {
  const pool = modes.filter((m) => m !== avoid);
  return pool[Math.floor(Math.random() * pool.length)];
};

export const unlockedPacks = (level: number) => PACKS.filter((p) => p.unlock <= level);

export interface BuildOpts {
  /** False while new content is paused by the three-mistake rule: only already-seen expressions. */
  allowNew?: boolean;
  /** Expressions that must be reviewed first (missed on a previous day). */
  priority?: string[];
}

const known = (cards: Record<string, Card>) => (x: Expression) => !!cards[x.id];

/** An episode: every expression of the pack twice in different modes, plus due reviews. */
export function buildEpisode(packId: string, cards: Record<string, Card>, diff: Diff, now = Date.now(), opts: BuildOpts = {}): Challenge[] {
  const all = PACK_BY_ID[packId].expressions;
  const xs = shuffle(opts.allowNew === false ? all.filter(known(cards)) : all);
  if (!xs.length) return [];
  const modes = shuffle(IN_RUN_MODES as RunMode[]);
  const round1 = xs.map((x, i) => makeChallenge(modes[i % modes.length], x, diff));
  const round2 = shuffle(xs)
    .slice(0, 4)
    .map((x) => makeChallenge(pickMode(IN_RUN_MODES as RunMode[], round1.find((c) => c.x.id === x.id)?.mode), x, diff));
  const reviews = dueIds(cards, now)
    .filter((id) => ALL[id] && ALL[id].pack !== packId)
    .slice(0, 2)
    .map((id) => makeChallenge(pickMode(REVIEW_MODES), ALL[id], Math.min(diff, 1) as Diff, { isReview: true }));
  const out = [...round1, ...round2];
  reviews.forEach((r, i) => out.splice(3 + i * 4, 0, r));
  return out;
}

const LESSON_SIZE = 8;

/**
 * The next lesson (always available): owed reviews first, then due cards, then new expressions
 * (when allowed) and one surprise from a locked pack. Known-but-not-due cards only fill gaps, and
 * mastered ones last, so nobody repeats what they already know.
 */
export function buildDaily(cards: Record<string, Card>, level: number, diff: Diff, now = Date.now(), opts: BuildOpts = {}): Challenge[] {
  const allowNew = opts.allowNew !== false;
  const open = unlockedPacks(level).flatMap((p) => p.expressions);
  const preferred = diff === 0 ? 'B1' : diff === 2 ? 'C1' : 'B2';
  const priority = (opts.priority ?? []).filter((id) => ALL[id]).slice(0, LESSON_SIZE).map((id) => ALL[id]);
  const used = new Set(priority.map((x) => x.id));
  const due = dueIds(cards, now)
    .filter((id) => ALL[id] && !used.has(id))
    .slice(0, priority.length ? Math.max(0, LESSON_SIZE - priority.length) : 3)
    .map((id) => ALL[id]);
  due.forEach((x) => used.add(x.id));
  const fresh = allowNew
    ? shuffle(open.filter((x) => !cards[x.id] && !used.has(x.id)))
        .sort((a, b) => Number(b.level === preferred) - Number(a.level === preferred))
        .slice(0, 3)
    : [];
  fresh.forEach((x) => used.add(x.id));
  const locked = allowNew ? ALL_LIST.filter((x) => PACK_BY_ID[x.pack].unlock > level && !cards[x.id]) : [];
  const surprise = locked.length ? [locked[Math.floor(Math.random() * locked.length)]] : [];
  surprise.forEach((x) => used.add(x.id));
  const room = Math.max(0, LESSON_SIZE - used.size);
  const learning = shuffle(ALL_LIST.filter((x) => cards[x.id] && !used.has(x.id) && cards[x.id].box < 5)).sort((a, b) => cards[a.id].box - cards[b.id].box);
  const masteredPool = shuffle(ALL_LIST.filter((x) => cards[x.id] && !used.has(x.id) && cards[x.id].box >= 5));
  const unseenFill = allowNew ? shuffle(open.filter((x) => !used.has(x.id) && !cards[x.id])) : [];
  const filler = [...learning, ...unseenFill, ...masteredPool].slice(0, room);

  let last: RunMode | undefined;
  const mk = (x: Expression, flags: Partial<Challenge> = {}) => {
    const m = pickMode(flags.isReview ? REVIEW_MODES : (IN_RUN_MODES as RunMode[]), last);
    last = m;
    return makeChallenge(m, x, diff, flags);
  };
  // Owed reviews open the lesson, in order; the rest is mixed.
  const head = priority.map((x) => mk(x, { isReview: true }));
  const rest = shuffle([...due.map((x) => mk(x, { isReview: true })), ...fresh.map((x) => mk(x)), ...filler.map((x) => mk(x, { isReview: !!cards[x.id] }))]);
  surprise.forEach((x) => rest.splice(Math.min(rest.length, 4), 0, mk(x, { isSurprise: true })));
  return [...head, ...rest].slice(0, Math.max(LESSON_SIZE, head.length));
}

/** Focused practice of one mode, from unlocked packs (optionally one pack). */
export function buildPractice(mode: RunMode, cards: Record<string, Card>, level: number, diff: Diff, packId?: string, opts: BuildOpts = {}): Challenge[] {
  let pool = packId ? PACK_BY_ID[packId].expressions : unlockedPacks(level).flatMap((p) => p.expressions);
  if (opts.allowNew === false) pool = (packId ? pool : ALL_LIST).filter(known(cards));
  // Weakest known first, then some new ones.
  const knownXs = shuffle(pool.filter((x) => cards[x.id])).sort((a, b) => cards[a.id].box - cards[b.id].box).slice(0, 5);
  const fresh = shuffle(pool.filter((x) => !cards[x.id]));
  const picked = shuffle([...knownXs, ...fresh, ...shuffle(pool.filter((x) => cards[x.id] && !knownXs.includes(x)))]).slice(0, 8);
  if (mode === 'sarcasm') {
    // Tone practice is more interesting with a majority of non-sincere lines.
    picked.sort((a, b) => Number(b.intent !== 'sincere') - Number(a.intent !== 'sincere'));
  }
  return shuffle(picked.slice(0, 8)).map((x) => makeChallenge(mode, x, diff));
}

/** Does this pack still hold expressions the user has never seen? */
export const packHasNew = (packId: string, cards: Record<string, Card>) => PACK_BY_ID[packId].expressions.some((x) => !cards[x.id]);

/* ───── Quick Fire ───── */

export interface QuickItem {
  id: string;
  x: Expression;
  kind: 'natural' | 'meaning';
  line: string;
  claim?: string;
  truth: boolean;
}

export function buildQuickFire(level: number, count = 60): QuickItem[] {
  const pool = unlockedPacks(level).flatMap((p) => p.expressions);
  const out: QuickItem[] = [];
  for (let i = 0; i < count; i++) {
    const x = pool[Math.floor(Math.random() * pool.length)];
    const truth = Math.random() < 0.5;
    if (Math.random() < 0.5) {
      out.push({ id: `q${i}`, x, kind: 'natural', line: truth ? plain(x.en) : x.calques[Math.floor(Math.random() * 2)], truth });
    } else {
      const lie = Math.random() < 0.5 ? x.literal : x.wrong[Math.floor(Math.random() * 2)];
      out.push({ id: `q${i}`, x, kind: 'meaning', line: plain(x.en), claim: truth ? x.gist : lie, truth });
    }
  }
  return out;
}

/* ───── Memory ───── */

export function buildMemory(cards: Record<string, Card>, now = Date.now()): Expression[] {
  const due = dueIds(cards, now).filter((id) => ALL[id]).slice(0, 12);
  // Short on due cards: top up with the weakest ones so a session is worth opening.
  const weakest = Object.entries(cards)
    .filter(([id]) => ALL[id] && !due.includes(id))
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([id]) => id)
    .slice(0, Math.max(0, 6 - due.length));
  return [...due, ...weakest].map((id) => ALL[id]);
}

/* ───── Daily content ───── */

export function phraseOfTheDay(day: string): Expression {
  const r = seeded('potd-' + day)();
  return ALL_LIST[Math.floor(r * ALL_LIST.length)];
}

export function weeklyPack(day: string, level: number) {
  const d = new Date(day + 'T12:00:00');
  const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 86400000));
  const open = unlockedPacks(level);
  return open[Math.floor(seeded(`week-${d.getFullYear()}-${week}`)() * open.length)];
}

export type { Mode };
