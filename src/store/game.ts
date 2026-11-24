import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cloudStorage, localStore } from '../services/cloud';
import { ALL, PACKS } from '../data/content';
import { ACHIEVEMENTS, type MissionKind, type Mode } from '../data/meta';
import { dayKey, daysBetween } from '../engine/date';
import { dailyMissions, type MissionState } from '../engine/missions';
import { levelFromXp } from '../engine/progression';
import { masteredCount, newCard, onAnswer, onGrade, INTERVALS, type Card } from '../engine/srs';
import type { Challenge } from '../engine/challenges';
import { weeklyPack } from '../engine/session';
import { LEARNING_RUNS, afterReview, afterSession, gateFor, gateWithChance, nextLocalMidnight, settle, type ExtraChance, type ReviewLock } from '../engine/gate';
import { EXTRA_CHANCE_PRICE, isPerfect, lessonKey, type TokenMove } from '../engine/tokens';
import { BADGE_BY_ID, canBuy, type PurchaseCheck } from '../badges/catalog';

export type Screen = 'today' | 'library' | 'games' | 'phrases' | 'translate' | 'profile' | 'shop' | 'play' | 'quickfire' | 'memory' | 'twist' | 'voice' | 'results';
export type RunMode = Challenge['mode'];
export type RunKind = Run['kind'];

export type Run =
  | { kind: 'episode'; packId: string }
  | { kind: 'daily' }
  | { kind: 'practice'; mode: RunMode; packId?: string }
  | { kind: 'quickfire' }
  | { kind: 'memory' }
  | { kind: 'twist'; collection?: import('../data/twists').TwistCollection }
  | { kind: 'voice' };

export interface RunSummary {
  run: Run;
  total: number;
  firstTry: number;
  maxCombo: number;
  xp: number;
  newIds: string[];
  missedIds: string[];
  /** Distinct expressions missed on a first try in this session (retries never count). */
  mistakes?: string[];
  /** Gate state when the session started (to detect a completed review). */
  gateAtStart?: import('../engine/gate').GateState;
  score?: number;
  ms: number;
  /** Expressions played in the session (identifies the lesson for token rewards). */
  ids?: string[];
  /** The session started thanks to an EXTRA CHANCE bought with a token. */
  usedExtraChance?: boolean;
}

export interface RunResult extends RunSummary {
  accuracy: number;
  totalXp: number;
  bonuses: { label: string; xp: number }[];
  levelUp?: { from: number; to: number };
  streakUp?: number;
  newAchievements: string[];
  newBest?: boolean;
  /** Set when this session hit the mistake limit: new content waits until tomorrow. */
  lockTriggered?: { mistakes: number; ids: string[] };
  /** Set when this session finished the review owed from a previous day. */
  reviewCleared?: boolean;
  /** Mistakes counted for the rule in this session. */
  mistakeCount?: number;
  /** SIDEYE TOKENS: +1 for this perfect lesson. */
  tokenEarned?: boolean;
  /** Perfect, but this lesson had already paid its token. */
  tokenAlready?: boolean;
}

export interface Toast {
  id: number;
  title: string;
  text: string;
}

export type Goal = 'series' | 'work' | 'dating' | 'social';
export const GOAL_PACKS: Record<Goal, string[]> = {
  series: ['popculture', 'plottwists', 'slang', 'sarcasm'],
  work: ['office', 'passive', 'meant', 'idioms'],
  dating: ['dating', 'redflags', 'maincharacter', 'twoam'],
  social: ['friends', 'awkward', 'everyday', 'sarcasm'],
};

interface Persisted {
  onboarded: boolean;
  name: string;
  goals: Goal[];
  xp: number;
  streak: number;
  bestStreak: number;
  lastPlayDay: string | null;
  freezes: number;
  hints: number;
  hintsDay: string;
  cards: Record<string, Card>;
  /** Spaced repetition for Twist scenes and Voice Acting rounds (same rules as cards). */
  extra: Record<string, Card>;
  packs: Record<string, { plays: number; best: number }>;
  byMode: Partial<Record<Mode, { a: number; c: number }>>;
  stats: {
    answered: number;
    correct: number;
    bestCombo: number;
    sessions: number;
    perfect: number;
    qfBest: number;
    memoryReviews: number;
    sarcasmCaught: number;
    naturalRight: number;
    c1Right: number;
    nightOwl: boolean;
    minutes: number;
  };
  activity: Record<string, number>;
  missions: { day: string; list: MissionState[]; bonusClaimed: boolean };
  dailyDone: string | null;
  reviewLock: ReviewLock | null;
  lessons: number;
  /** SIDEYE TOKENS balance (never expires, never bought with money). */
  tokens: number;
  /** Token movements, newest first (kept short). */
  tokenLog: TokenMove[];
  /** Lessons that already paid their token: lessonKey → time. */
  tokenAwards: Record<string, number>;
  /** THE BADGE SHOP: badge id → time bought. Collectibles only. */
  badges: Record<string, number>;
  /** EXTRA CHANCE lessons bought for today. */
  extraChance: ExtraChance | null;
  achievements: Record<string, number>;
  recent: boolean[];
  settings: Settings;
  translations: TranslationEntry[];
}

export interface Settings {
  sound: boolean;
  /** Play the English line automatically after answering. */
  voice: boolean;
  /** Use the device voice when the AI voice is unavailable. */
  browserVoiceFallback: boolean;
}

export interface TranslationEntry {
  at: number;
  text: string;
  direction: 'auto' | 'en-es' | 'es-en';
  context: string;
  result: import('../services/api').Translation;
}

interface Volatile {
  screen: Screen;
  tab: Screen;
  run: Run | null;
  runId: number;
  result: RunResult | null;
  toasts: Toast[];
  openX: string | null;
  openPack: string | null;
  translatorDraft: string | null;
}

interface Actions {
  go: (s: Screen) => void;
  finishOnboarding: (name: string, goals: Goal[]) => void;
  newDay: () => void;
  start: (run: Run) => void;
  answer: (id: string, correct: boolean, o: { mode: RunMode; isRetry?: boolean; combo: number }) => { isNew: boolean };
  grade: (id: string, g: 0 | 1 | 2) => void;
  answerExtra: (id: string, correct: boolean, o: { mode: 'twist' | 'voice'; combo: number }) => { isNew: boolean };
  finishRun: (s: RunSummary) => void;
  quit: () => void;
  savePhrase: (id: string) => void;
  toggleFav: (id: string) => void;
  useHint: () => boolean;
  claimMission: (id: string) => void;
  claimBonus: () => void;
  openExpression: (id: string | null) => void;
  openPackSheet: (id: string | null) => void;
  dismissToast: (id: number) => void;
  toggleSetting: (k: keyof Settings) => void;
  openTranslator: (text: string) => void;
  saveTranslation: (e: TranslationEntry) => void;
  reset: () => void;
  /** Spends 1 token for one more lesson today. false if not locked today or not enough tokens. */
  buyExtraChance: () => boolean;
  /** Spends the badge's price. Never twice, never if not on sale, never with an insufficient balance. */
  buyBadge: (id: string) => PurchaseCheck;
}

export type GameState = Persisted & Volatile & Actions;

/** Carries name, XP and streak over from the previous version of the game. */
function legacy(): Partial<Persisted> {
  try {
    const raw = localStore.getItem('lumora-save-v1');
    if (!raw || typeof raw !== 'string') return {};
    const s = JSON.parse(raw).state ?? {};
    return { name: s.name ?? '', xp: s.xp ?? 0, streak: s.streak ?? 0, bestStreak: s.bestStreak ?? 0, lastPlayDay: s.lastPlayDay ?? null, settings: { sound: s.settings?.sound ?? true, voice: s.settings?.voice ?? true, browserVoiceFallback: true } };
  } catch {
    return {};
  }
}

const initial = (): Persisted => ({
  onboarded: false,
  name: '',
  goals: [],
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastPlayDay: null,
  freezes: 1,
  hints: 3,
  hintsDay: dayKey(),
  cards: {},
  extra: {},
  packs: {},
  byMode: {},
  stats: { answered: 0, correct: 0, bestCombo: 0, sessions: 0, perfect: 0, qfBest: 0, memoryReviews: 0, sarcasmCaught: 0, naturalRight: 0, c1Right: 0, nightOwl: false, minutes: 0 },
  activity: {},
  missions: { day: dayKey(), list: dailyMissions(dayKey()), bonusClaimed: false },
  dailyDone: null,
  reviewLock: null,
  lessons: 0,
  tokens: 0,
  tokenLog: [],
  tokenAwards: {},
  badges: {},
  extraChance: null,
  achievements: {},
  recent: [],
  settings: { sound: true, voice: true, browserVoiceFallback: true },
  translations: [],
  ...legacy(),
});

const volatile = (): Volatile => ({ screen: 'today', tab: 'today', run: null, runId: 0, result: null, toasts: [], openX: null, openPack: null, translatorDraft: null });

let toastId = 1;
const TABS: Screen[] = ['today', 'library', 'games', 'phrases', 'translate', 'shop', 'profile'];

export const playerLevel = (xp: number) => levelFromXp(xp).level;
export const packMastery = (cards: Record<string, Card>, packId: string) => {
  const p = PACKS.find((x) => x.id === packId)!;
  return p.expressions.reduce((s, x) => s + Math.min(5, cards[x.id]?.box ?? 0), 0) / (p.expressions.length * 5);
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const bump = (kind: MissionKind, value: number, mode: 'add' | 'max' = 'add') => {
        const m = get().missions;
        set({
          missions: {
            ...m,
            list: m.list.map((x) =>
              x.kind !== kind || x.claimed ? x : { ...x, progress: Math.min(x.target, mode === 'add' ? x.progress + value : Math.max(x.progress, value)) },
            ),
          },
        });
      };

      const checkAchievements = (): string[] => {
        const s = get();
        const has: Record<string, boolean> = {
          first: s.stats.sessions >= 1,
          streak3: s.streak >= 3,
          streak7: s.streak >= 7,
          streak14: s.streak >= 14,
          combo10: s.stats.bestCombo >= 10,
          perfect: s.stats.perfect >= 1,
          sarcasm10: s.stats.sarcasmCaught >= 10,
          literal15: s.stats.naturalRight >= 15,
          phrases25: Object.keys(s.cards).length >= 25,
          mastered10: masteredCount(s.cards) >= 10,
          qf20: s.stats.qfBest >= 20,
          memory30: s.stats.memoryReviews >= 30,
          c1x10: s.stats.c1Right >= 10,
          night: s.stats.nightOwl,
          packs5: Object.values(s.packs).filter((p) => p.plays > 0).length >= 5,
          lvl5: playerLevel(s.xp) >= 5,
        };
        const fresh = ACHIEVEMENTS.filter((a) => has[a.id] && !s.achievements[a.id]);
        if (!fresh.length) return [];
        const now = Date.now();
        set({
          achievements: { ...s.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, now])) },
          toasts: [...s.toasts, ...fresh.map((a) => ({ id: toastId++, title: 'Achievement unlocked', text: a.name }))],
        });
        return fresh.map((a) => a.id);
      };

      let moveSeq = 0;
      const move = (delta: number, reason: string): TokenMove => ({ id: `${Date.now().toString(36)}-${(moveSeq++).toString(36)}`, at: Date.now(), delta, reason });
      const withMove = (log: TokenMove[], m: TokenMove) => [m, ...log].slice(0, 80);

      return {
        ...initial(),
        ...volatile(),

        go: (screen) => set(TABS.includes(screen) ? { screen, tab: screen } : { screen }),

        finishOnboarding: (name, goals) => set({ onboarded: true, name: name.trim() || 'friend', goals, screen: 'today', tab: 'today' }),

        newDay: () => {
          const s = get();
          const today = dayKey();
          const patch: Partial<Persisted> = {};
          const settled = settle(s.reviewLock, today);
          if (settled !== s.reviewLock) patch.reviewLock = settled;
          // Unused EXTRA CHANCES from an earlier day go back to the balance.
          if (s.extraChance && s.extraChance.day !== today) {
            const left = Math.max(0, s.extraChance.left);
            patch.extraChance = null;
            if (left) {
              patch.tokens = s.tokens + left * EXTRA_CHANCE_PRICE;
              patch.tokenLog = withMove(s.tokenLog, move(left * EXTRA_CHANCE_PRICE, left === 1 ? 'Devolución: extra chance sin usar' : `Devolución: ${left} extra chances sin usar`));
            }
          }
          if (s.missions.day !== today) patch.missions = { day: today, list: dailyMissions(today), bonusClaimed: false };
          if (s.hintsDay !== today) {
            patch.hints = Math.max(s.hints, 3);
            patch.hintsDay = today;
          }
          if (s.lastPlayDay && s.streak > 0) {
            const gap = daysBetween(s.lastPlayDay, today);
            if (gap > 1) {
              const missed = gap - 1;
              if (s.freezes >= missed) {
                patch.freezes = s.freezes - missed;
                patch.lastPlayDay = dayKey(new Date(Date.now() - 86400000));
                set({ toasts: [...s.toasts, { id: toastId++, title: 'Streak protected', text: `Usaste ${missed} escudo${missed > 1 ? 's' : ''}. La racha sigue viva.` }] });
              } else {
                patch.streak = 0;
              }
            }
          }
          set(patch);
        },

        start: (run) => {
          const screen: Screen = run.kind === 'quickfire' || run.kind === 'memory' || run.kind === 'twist' || run.kind === 'voice' ? run.kind : 'play';
          set({ run, screen, result: null, runId: get().runId + 1, openPack: null, openX: null });
        },

        answer: (id, correct, { mode, isRetry, combo }) => {
          const s = get();
          const now = Date.now();
          const x = ALL[id];
          const isNew = !s.cards[id];
          const cards = { ...s.cards };
          // A correct retry does not promote the card: it was just shown the answer.
          if (!(isRetry && correct)) cards[id] = onAnswer(cards[id], correct, now);
          const bm = s.byMode[mode] ?? { a: 0, c: 0 };
          set({
            cards,
            reviewLock: correct && !isRetry ? afterReview(s.reviewLock, dayKey(), id) : s.reviewLock,
            recent: isRetry ? s.recent : [...s.recent, correct].slice(-30),
            byMode: { ...s.byMode, [mode]: { a: bm.a + 1, c: bm.c + (correct ? 1 : 0) } },
            stats: {
              ...s.stats,
              answered: s.stats.answered + 1,
              correct: s.stats.correct + (correct ? 1 : 0),
              bestCombo: Math.max(s.stats.bestCombo, combo),
              sarcasmCaught: s.stats.sarcasmCaught + (correct && mode === 'sarcasm' && !isRetry ? 1 : 0),
              naturalRight: s.stats.naturalRight + (correct && mode === 'natural' && !isRetry ? 1 : 0),
              c1Right: s.stats.c1Right + (correct && x?.level === 'C1' && !isRetry ? 1 : 0),
            },
          });
          if (correct) bump('correct', 1);
          if (correct && mode === 'sarcasm' && !isRetry) bump('sarcasm', 1);
          if (isNew) bump('discover', 1);
          bump('combo', combo, 'max');
          return { isNew };
        },

        grade: (id, g) => {
          const s = get();
          const inExtra = !!s.extra[id] && !ALL[id];
          const card = (inExtra ? s.extra[id] : s.cards[id]) ?? newCard(Date.now());
          set({
            ...(inExtra ? { extra: { ...s.extra, [id]: onGrade(card, g, Date.now()) } } : { cards: { ...s.cards, [id]: onGrade(card, g, Date.now()) } }),
            reviewLock: g >= 1 ? afterReview(s.reviewLock, dayKey(), id) : s.reviewLock,
            stats: { ...s.stats, memoryReviews: s.stats.memoryReviews + 1 },
          });
          bump('memory', 1);
        },

        answerExtra: (id, correct, { mode, combo }) => {
          const s = get();
          const now = Date.now();
          const isNew = !s.extra[id];
          const bm = s.byMode[mode] ?? { a: 0, c: 0 };
          set({
            extra: { ...s.extra, [id]: onAnswer(s.extra[id], correct, now) },
            reviewLock: correct ? afterReview(s.reviewLock, dayKey(), id) : s.reviewLock,
            recent: [...s.recent, correct].slice(-30),
            byMode: { ...s.byMode, [mode]: { a: bm.a + 1, c: bm.c + (correct ? 1 : 0) } },
            stats: {
              ...s.stats,
              answered: s.stats.answered + 1,
              correct: s.stats.correct + (correct ? 1 : 0),
              bestCombo: Math.max(s.stats.bestCombo, combo),
              sarcasmCaught: s.stats.sarcasmCaught + (correct && mode === 'voice' ? 1 : 0),
            },
          });
          if (correct) bump('correct', 1);
          bump('combo', combo, 'max');
          return { isNew };
        },

        finishRun: (sum) => {
          const s = get();
          const today = dayKey();
          const accuracy = sum.total ? sum.firstTry / sum.total : 0;
          const bonuses: RunResult['bonuses'] = [];
          let base = sum.xp;

          if (sum.run.kind === 'episode') {
            bonuses.push({ label: 'Episodio completado', xp: 20 });
            if (weeklyPack(today, playerLevel(s.xp))?.id === sum.run.packId) {
              const extra = Math.round(base * 0.5);
              if (extra) bonuses.push({ label: 'Colección de la semana ×1.5', xp: extra });
            }
          }
          if (sum.run.kind === 'practice') bonuses.push({ label: 'Práctica completada', xp: 15 });
          const dailyFirst = sum.run.kind === 'daily' && s.dailyDone !== today;
          if (dailyFirst) bonuses.push({ label: 'Primera lección del día', xp: 40 });
          if (sum.run.kind !== 'quickfire' && sum.run.kind !== 'memory' && sum.total >= 5 && accuracy === 1) bonuses.push({ label: 'Sin fallos', xp: 15 });
          const newBest = sum.run.kind === 'quickfire' && (sum.score ?? 0) > s.stats.qfBest;
          if (newBest && s.stats.qfBest > 0) bonuses.push({ label: 'Nuevo récord', xp: 20 });
          if (sum.run.kind === 'quickfire') base = (sum.score ?? 0) * 3;

          const totalXp = base + bonuses.reduce((a, b) => a + b.xp, 0);
          const from = playerLevel(s.xp);
          const to = playerLevel(s.xp + totalXp);

          let streak = s.streak;
          let streakUp: number | undefined;
          const played = sum.total > 0 || (sum.score ?? 0) > 0;
          if (played && s.lastPlayDay !== today) {
            streak = s.lastPlayDay && daysBetween(s.lastPlayDay, today) === 1 ? s.streak + 1 : 1;
            streakUp = streak;
          }
          const freezes = streakUp && streak % 7 === 0 ? Math.min(3, s.freezes + 1) : s.freezes;

          const packs = { ...s.packs };
          if (sum.run.kind === 'episode') {
            const p = packs[sum.run.packId] ?? { plays: 0, best: 0 };
            packs[sum.run.packId] = { plays: p.plays + 1, best: Math.max(p.best, Math.round(accuracy * 100)) };
          }
          // Three-mistake rule: only learning sessions count, and only distinct first-try misses.
          const isLearning = (LEARNING_RUNS as readonly string[]).includes(sum.run.kind);
          const mistakes = [...new Set(sum.mistakes ?? [])];
          let reviewLock = isLearning ? afterSession(s.reviewLock, today, mistakes) : s.reviewLock;
          reviewLock = settle(reviewLock, today);
          const lockTriggered = isLearning && mistakes.length >= 3 ? { mistakes: mistakes.length, ids: mistakes } : undefined;
          let cards = s.cards;
          let extra = s.extra;
          if (lockTriggered) {
            // Missed expressions come back first thing tomorrow (local midnight), as the start of the review.
            const due = nextLocalMidnight();
            cards = { ...s.cards };
            for (const id of mistakes) if (cards[id]) cards[id] = { ...cards[id], box: 0, due };
            extra = { ...s.extra };
            for (const id of mistakes) if (extra[id]) extra[id] = { ...extra[id], box: 0, due };
          }
          const reviewCleared = sum.gateAtStart === 'review-first' && gateFor(reviewLock, today).canLearnNew;

          // SIDEYE TOKENS: +1 for a perfect lesson, once per lesson (same evaluation as above).
          let tokens = s.tokens;
          let tokenLog = s.tokenLog;
          let tokenAwards = s.tokenAwards;
          let tokenEarned = false;
          let tokenAlready = false;
          const key = lessonKey(sum.run, sum.ids);
          if (key && isPerfect(sum)) {
            if (tokenAwards[key]) tokenAlready = true;
            else {
              tokenEarned = true;
              tokens += 1;
              tokenAwards = { ...tokenAwards, [key]: Date.now() };
              const what = sum.run.kind === 'episode' ? `episodio perfecto · ${PACKS.find((p) => p.id === (sum.run as { packId: string }).packId)?.title ?? ''}` : `lección perfecta · Lección ${s.lessons + 1}`;
              tokenLog = withMove(tokenLog, move(1, what[0].toUpperCase() + what.slice(1)));
            }
          }
          // A finished session that started with an EXTRA CHANCE uses it up.
          let extraChance = s.extraChance;
          if (sum.usedExtraChance && extraChance && extraChance.day === today && extraChance.left > 0) {
            extraChance = extraChance.left > 1 ? { ...extraChance, left: extraChance.left - 1 } : null;
          }

          const h = new Date().getHours();
          const byMode = { ...s.byMode };
          if (sum.run.kind === 'quickfire') {
            const q = byMode.quickfire ?? { a: 0, c: 0 };
            byMode.quickfire = { a: q.a + sum.total, c: q.c + (sum.score ?? 0) };
          }

          set({
            xp: s.xp + totalXp,
            streak,
            bestStreak: Math.max(s.bestStreak, streak),
            lastPlayDay: played ? today : s.lastPlayDay,
            freezes,
            packs,
            byMode,
            dailyDone: dailyFirst ? today : s.dailyDone,
            reviewLock,
            cards,
            extra,
            lessons: s.lessons + (sum.run.kind === 'daily' ? 1 : 0),
            tokens,
            tokenLog,
            tokenAwards,
            extraChance,
            activity: Object.fromEntries(Object.entries({ ...s.activity, [today]: (s.activity[today] ?? 0) + totalXp }).slice(-60)),
            stats: {
              ...s.stats,
              sessions: s.stats.sessions + (sum.run.kind === 'memory' && sum.total === 0 ? 0 : 1),
              perfect: s.stats.perfect + (bonuses.some((b) => b.label === 'Sin fallos') ? 1 : 0),
              qfBest: Math.max(s.stats.qfBest, sum.run.kind === 'quickfire' ? sum.score ?? 0 : 0),
              nightOwl: s.stats.nightOwl || h < 4,
              minutes: s.stats.minutes + Math.round(sum.ms / 60000),
            },
          });
          if (played) bump('sessions', 1);
          if (dailyFirst) bump('daily', 1);
          if (sum.run.kind === 'quickfire') bump('quickfire', sum.score ?? 0, 'max');

          const newAchievements = checkAchievements();
          set({
            screen: 'results',
            result: { ...sum, accuracy, totalXp, bonuses, levelUp: to > from ? { from, to } : undefined, streakUp, newAchievements, newBest, lockTriggered, reviewCleared, mistakeCount: isLearning ? mistakes.length : undefined, tokenEarned, tokenAlready },
          });
        },

        quit: () => set({ screen: get().tab, run: null }),

        savePhrase: (id) => {
          const s = get();
          if (s.cards[id]) return;
          const now = Date.now();
          set({ cards: { ...s.cards, [id]: { ...newCard(now), due: now + INTERVALS[0] } } });
          bump('discover', 1);
          checkAchievements();
        },

        toggleFav: (id) => {
          const s = get();
          const c = s.cards[id] ?? { ...newCard(Date.now()), due: Date.now() + INTERVALS[0] };
          set({ cards: { ...s.cards, [id]: { ...c, fav: !c.fav } } });
        },

        useHint: () => {
          const s = get();
          if (s.hints <= 0) return false;
          set({ hints: s.hints - 1 });
          return true;
        },

        claimMission: (id) => {
          const s = get();
          const m = s.missions.list.find((x) => x.id === id);
          if (!m || m.claimed || m.progress < m.target) return;
          set({
            xp: s.xp + m.reward,
            activity: { ...s.activity, [dayKey()]: (s.activity[dayKey()] ?? 0) + m.reward },
            missions: { ...s.missions, list: s.missions.list.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
          });
          checkAchievements();
        },

        claimBonus: () => {
          const s = get();
          if (s.missions.bonusClaimed || !s.missions.list.every((m) => m.claimed)) return;
          set({
            xp: s.xp + 60,
            freezes: Math.min(3, s.freezes + 1),
            hints: s.hints + 2,
            missions: { ...s.missions, bonusClaimed: true },
            toasts: [...s.toasts, { id: toastId++, title: 'Daily set complete', text: '+60 XP · +1 escudo de racha · +2 comodines' }],
          });
          checkAchievements();
        },

        openExpression: (id) => set({ openX: id }),
        openPackSheet: (id) => set({ openPack: id }),
        dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
        toggleSetting: (k) => set({ settings: { ...get().settings, [k]: !get().settings[k] } }),
        openTranslator: (text) => set({ translatorDraft: text, screen: 'translate', tab: 'translate', openX: null }),
        saveTranslation: (e) => set({ translations: [e, ...get().translations.filter((t) => t.text !== e.text || t.direction !== e.direction)].slice(0, 12) }),
        reset: () => set({ ...initial(), ...volatile(), name: '', xp: 0, streak: 0, bestStreak: 0, lastPlayDay: null }),

        buyExtraChance: () => {
          const s = get();
          const today = dayKey();
          // Only when the 3-mistake lock is active today, and only with enough balance.
          if (gateFor(s.reviewLock, today).state !== 'locked-today' || s.tokens < EXTRA_CHANCE_PRICE) return false;
          // One chance at a time: a second tap (or double tap) cannot spend another token
          // until the bought lesson has been played.
          if (s.extraChance && s.extraChance.day === today && s.extraChance.left > 0) return false;
          set({
            tokens: s.tokens - EXTRA_CHANCE_PRICE,
            extraChance: { day: today, left: 1 },
            tokenLog: withMove(s.tokenLog, move(-EXTRA_CHANCE_PRICE, 'Extra chance: una lección más hoy')),
          });
          return true;
        },

        buyBadge: (id) => {
          const s = get();
          const badge = BADGE_BY_ID[id];
          const check = canBuy(badge, s.badges, s.tokens);
          if (check !== 'ok') return check;
          set({
            tokens: s.tokens - badge.price,
            badges: { ...s.badges, [id]: Date.now() },
            tokenLog: withMove(s.tokenLog, move(-badge.price, `Escudo: ${badge.name}`)),
          });
          return 'ok';
        },
      } as GameState;
    },
    {
      // Internal storage key from the app's previous name. Do NOT rename: it holds every player's
      // progress (browser and cloud copies). It is never shown to users.
      name: 'subtext-save-v1',
      storage: createJSONStorage(() => cloudStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { screen, tab, run, runId, result, toasts, openX, openPack, translatorDraft, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as unknown as Persisted;
      },
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        stats: { ...current.stats, ...((persisted as Persisted)?.stats ?? {}) },
        settings: { ...current.settings, ...((persisted as Persisted)?.settings ?? {}) },
      }),
    },
  ),
);

/** Current progression gate for the user's local calendar day. */
export const useGate = () => {
  const lock = useGame((s) => s.reviewLock);
  const chance = useGame((s) => s.extraChance);
  return gateWithChance(lock, dayKey(), chance);
};
