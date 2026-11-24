import { ALL, ALL_LIST, PACKS, PACK_BY_ID, plain } from '../data/content';
import { IN_RUN_MODES, type Mode } from '../data/meta';
import { NEW_PHRASE_SLOTS, tierOf } from '../data/levels';
import type { Expression, Tier } from '../data/types';
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

/* ───── New phrases: the 4-3-2-1 rule ─────
   Every block of 10 NEW phrases = 4 FIRST STEPS + 3 GETTING COMFORTABLE + 2 REAL-LIFE ENGLISH
   + 1 higher (READ BETWEEN THE LINES; alternating with THINK IN ENGLISH once half of level 4 is
   seen). The position in the block comes from how many phrases the player has already met, so
   the proportion holds across lessons, practice and episodes. When a level runs out, the next
   harder one is used (gradual), then easier ones. */

/** Phrases already met (expressions only). */
export const phrasesMet = (cards: Record<string, Card>) => Object.keys(cards).filter((id) => ALL[id]).length;

function topTier(cards: Record<string, Card>, block: number): Tier {
  const l4 = ALL_LIST.filter((x) => tierOf(x) === 4);
  const seen4 = l4.filter((x) => cards[x.id]).length;
  return seen4 >= l4.length / 2 && block % 2 === 1 ? 5 : 4;
}

/** The tier each of the next `count` new phrases should have. */
export function nextNewTiers(cards: Record<string, Card>, count: number, offset = 0): Tier[] {
  const start = phrasesMet(cards) + offset;
  return Array.from({ length: count }, (_, k) => {
    const slot = NEW_PHRASE_SLOTS[(start + k) % NEW_PHRASE_SLOTS.length];
    return slot === 'top' ? topTier(cards, Math.floor((start + k) / NEW_PHRASE_SLOTS.length)) : slot;
  });
}

/**
 * The next `count` new phrases following the rule. Levels 1–3 come from unlocked collections;
 * the higher slot may come from any collection (from a locked one it is shown as a surprise).
 */
export function pickNew(cards: Record<string, Card>, count: number, level: number, opts: { exclude?: Set<string>; offset?: number; pool?: Expression[] } = {}): Expression[] {
  const taken = new Set(opts.exclude ?? []);
  const base = (opts.pool ?? ALL_LIST).filter((x) => !cards[x.id]);
  const out: Expression[] = [];
  for (const want of nextNewTiers(cards, count, opts.offset ?? 0)) {
    const free = base.filter((x) => !taken.has(x.id));
    if (!free.length) break;
    // wanted level, then harder levels one by one, then easier ones
    const order = [want, ...([1, 2, 3, 4, 5] as Tier[]).filter((t) => t > want), ...([5, 4, 3, 2, 1] as Tier[]).filter((t) => t < want)];
    let x: Expression | undefined;
    for (const t of order) {
      // The level comes first; within it, collections already opened by experience are preferred.
      const c = shuffle(free.filter((e) => tierOf(e) === t));
      x = c.find((e) => PACK_BY_ID[e.pack].unlock <= level) ?? c[0];
      if (x) break;
    }
    if (!x) break;
    taken.add(x.id);
    out.push(x);
  }
  return out;
}

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
  const priority = (opts.priority ?? []).filter((id) => ALL[id]).slice(0, LESSON_SIZE).map((id) => ALL[id]);
  const used = new Set(priority.map((x) => x.id));
  const due = dueIds(cards, now)
    .filter((id) => ALL[id] && !used.has(id))
    .slice(0, priority.length ? Math.max(0, LESSON_SIZE - priority.length) : 3)
    .map((id) => ALL[id]);
  due.forEach((x) => used.add(x.id));
  // New phrases always follow the 4-3-2-1 rule (pickNew), also when they fill an empty lesson.
  const fresh = allowNew ? pickNew(cards, 3, level, { exclude: used }) : [];
  fresh.forEach((x) => used.add(x.id));
  const room = Math.max(0, LESSON_SIZE - used.size);
  const learning = shuffle(ALL_LIST.filter((x) => cards[x.id] && !used.has(x.id) && cards[x.id].box < 5)).sort((a, b) => cards[a.id].box - cards[b.id].box);
  const masteredPool = shuffle(ALL_LIST.filter((x) => cards[x.id] && !used.has(x.id) && cards[x.id].box >= 5));
  const unseenFill = allowNew && learning.length < room ? pickNew(cards, room - learning.length, level, { exclude: used, offset: fresh.length }) : [];
  const filler = [...learning, ...unseenFill, ...masteredPool].slice(0, room);
  const isSurprise = (x: Expression) => !cards[x.id] && PACK_BY_ID[x.pack].unlock > level;

  let last: RunMode | undefined;
  const mk = (x: Expression, flags: Partial<Challenge> = {}) => {
    const m = pickMode(flags.isReview ? REVIEW_MODES : (IN_RUN_MODES as RunMode[]), last);
    last = m;
    return makeChallenge(m, x, diff, flags);
  };
  // Owed reviews open the lesson, in order; the rest is mixed.
  const head = priority.map((x) => mk(x, { isReview: true }));
  const rest = shuffle([
    ...due.map((x) => mk(x, { isReview: true })),
    ...fresh.map((x) => mk(x, isSurprise(x) ? { isSurprise: true } : {})),
    ...filler.map((x) => mk(x, cards[x.id] ? { isReview: true } : isSurprise(x) ? { isSurprise: true } : {})),
  ]);
  return [...head, ...rest].slice(0, Math.max(LESSON_SIZE, head.length));
}

/** Focused practice of one mode, from unlocked packs (optionally one pack). */
export function buildPractice(mode: RunMode, cards: Record<string, Card>, level: number, diff: Diff, packId?: string, opts: BuildOpts = {}): Challenge[] {
  let pool = packId ? PACK_BY_ID[packId].expressions : unlockedPacks(level).flatMap((p) => p.expressions);
  if (opts.allowNew === false) pool = (packId ? pool : ALL_LIST).filter(known(cards));
  // Weakest known first, then new ones: a chosen collection is played as it is; otherwise new
  // phrases follow the 4-3-2-1 rule like everywhere else.
  const knownXs = shuffle(pool.filter((x) => cards[x.id])).sort((a, b) => cards[a.id].box - cards[b.id].box).slice(0, 5);
  const wantNew = Math.max(opts.allowNew === false ? 0 : 3, 8 - pool.filter((x) => cards[x.id]).length);
  const fresh = opts.allowNew === false ? [] : packId ? shuffle(pool.filter((x) => !cards[x.id])).slice(0, wantNew) : pickNew(cards, Math.min(wantNew, 8 - knownXs.length), level);
  const picked = shuffle([...knownXs, ...fresh, ...shuffle(pool.filter((x) => cards[x.id] && !knownXs.includes(x)))].slice(0, 8));
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

/** Quick Fire draws phrases with the same 4-3-2-1 weights (from unlocked collections). */
const QF_WEIGHTS: [Tier, number][] = [
  [1, 4],
  [2, 3],
  [3, 2],
  [4, 0.7],
  [5, 0.3],
];
export function buildQuickFire(level: number, count = 60): QuickItem[] {
  const pool = unlockedPacks(level).flatMap((p) => p.expressions);
  const byTier = new Map<Tier, Expression[]>(QF_WEIGHTS.map(([t]) => [t, pool.filter((x) => tierOf(x) === t)]));
  const weights = QF_WEIGHTS.filter(([t]) => byTier.get(t)!.length);
  const total = weights.reduce((a, [, w]) => a + w, 0);
  const draw = () => {
    let r = Math.random() * total;
    for (const [t, w] of weights) if ((r -= w) <= 0) return byTier.get(t)!;
    return pool;
  };
  const out: QuickItem[] = [];
  for (let i = 0; i < count; i++) {
    const list = draw();
    const x = list[Math.floor(Math.random() * list.length)];
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

/** Ids for a Memory session: expressions, Twist scenes and Voice Acting rounds share one queue. */
export function buildMemory(cards: Record<string, Card>, extra: Record<string, Card> = {}, now = Date.now(), valid: (id: string) => boolean = (id) => !!ALL[id]): string[] {
  const all: Record<string, Card> = { ...extra, ...cards };
  const due = dueIds(all, now).filter(valid).slice(0, 12);
  // Short on due cards: top up with the weakest ones so a session is worth opening.
  const weakest = Object.entries(all)
    .filter(([id]) => valid(id) && !due.includes(id))
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([id]) => id)
    .slice(0, Math.max(0, 6 - due.length));
  return [...due, ...weakest];
}

/* ───── Daily content ───── */

export function phraseOfTheDay(day: string): Expression {
  const r = seeded('potd-' + day)();
  return ALL_LIST[Math.floor(r * ALL_LIST.length)];
}

export function weeklyPack(day: string, level: number) {
  const d = new Date(day + 'T12:00:00');
  const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 86400000));
  // Collection of the week: never far above the player's stage (XP level → SIDEYE level).
  const maxTier = level <= 2 ? 2 : level <= 4 ? 3 : level <= 6 ? 4 : 5;
  const open = unlockedPacks(level).filter((p) => (p.tier ?? 1) <= maxTier);
  return open[Math.floor(seeded(`week-${d.getFullYear()}-${week}`)() * open.length)];
}

export type { Mode };

/* ───── The Unexpected Twist & Voice Acting ───── */

import { SCENES, type TwistCollection, type TwistScene } from '../data/twists';
import { LINES, roundId, parseRound, type Delivery, type VoiceLine } from '../data/voiceacting';

export interface TwistRound {
  scene: TwistScene;
  /** Options in display order, with the index of the right one. */
  order: number[];
  isReview: boolean;
}

/** Due reviews first (owed ones before anything), then unseen scenes (when new content is allowed). */
export function buildTwist(extra: Record<string, Card>, _diff: Diff, opts: BuildOpts & { collection?: TwistCollection } = {}, now = Date.now()): TwistRound[] {
  const pool = SCENES.filter((s) => !opts.collection || s.col === opts.collection);
  const priority = (opts.priority ?? []).map((id) => pool.find((s) => s.id === id)).filter(Boolean) as TwistScene[];
  const due = pool.filter((s) => extra[s.id] && extra[s.id].due <= now && !priority.includes(s));
  const fresh =
    opts.allowNew === false
      ? []
      : shuffle(pool.filter((s) => !extra[s.id])).sort((a, b) => tierOf(a) - tierOf(b)); // easier scenes first, gradually harder
  const known = shuffle(pool.filter((s) => extra[s.id] && !due.includes(s) && !priority.includes(s))).sort((a, b) => extra[a.id].box - extra[b.id].box);
  const picked = [...priority, ...shuffle(due), ...fresh, ...known].slice(0, Math.max(5, priority.length));
  return picked.map((scene) => ({ scene, order: shuffle([0, 1, 2, 3]), isReview: !!extra[scene.id] }));
}

export interface VoiceRound {
  line: VoiceLine;
  delivery: Delivery;
  /** Four intentions: the right one, the line's other deliveries and a decoy. */
  options: string[];
  isReview: boolean;
}

export function voiceRound(line: VoiceLine, delivery: Delivery, isReview: boolean): VoiceRound {
  const others = line.deliveries.filter((d) => d.id !== delivery.id).map((d) => d.intent);
  return { line, delivery, options: shuffle([delivery.intent, ...others, line.decoy]), isReview };
}

/**
 * Six rounds. One line appears twice with different deliveries, so the player hears the
 * same words change meaning inside a single session.
 */
export function buildVoice(extra: Record<string, Card>, opts: BuildOpts = {}, now = Date.now()): VoiceRound[] {
  const all = LINES.flatMap((l) => l.deliveries.map((d) => ({ l, d, id: roundId(l.id, d.id) })));
  const prio = (opts.priority ?? []).map((id) => all.find((r) => r.id === id)).filter(Boolean) as typeof all;
  const due = all.filter((r) => extra[r.id] && extra[r.id].due <= now && !prio.includes(r));
  const fresh = opts.allowNew === false ? [] : shuffle(all.filter((r) => !extra[r.id])).sort((a, b) => tierOf(a.l) - tierOf(b.l)); // easier lines first
  const known = shuffle(all.filter((r) => extra[r.id] && !due.includes(r) && !prio.includes(r))).sort((a, b) => extra[a.id].box - extra[b.id].box);
  const out: typeof all = [];
  const perLine = new Map<string, number>();
  for (const r of [...prio, ...shuffle(due), ...fresh, ...known]) {
    if (out.length >= Math.max(6, prio.length)) break;
    const n = perLine.get(r.l.id) ?? 0;
    if (n >= 2 || out.includes(r)) continue;
    perLine.set(r.l.id, n + 1);
    out.push(r);
  }
  // Make sure at least one line is heard in two different ways (when the pool allows it).
  if (![...perLine.values()].some((n) => n === 2) && opts.allowNew !== false) {
    const first = out.find((r) => !prio.includes(r));
    const twin = first && first.l.deliveries.find((d) => d.id !== first.d.id);
    if (first && twin && out.length && !prio.includes(out[out.length - 1])) out[out.length - 1] = { l: first.l, d: twin, id: roundId(first.l.id, twin.id) };
  }
  // Keep the two takes of the same line apart.
  return out.map((r) => voiceRound(r.l, r.d, !!extra[r.id]));
}

export { parseRound };
