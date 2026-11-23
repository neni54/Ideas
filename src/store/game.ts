import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { ACHIEVEMENTS, ITEMS, PETS, SKINS, type ItemId, type MissionKind } from '../data/meta';
import { WORLD1 } from '../data/world1';
import { dayKey, daysBetween } from '../engine/date';
import { dailyMissions, type MissionState } from '../engine/missions';
import { levelFromXp, starsFor } from '../engine/progression';
import { onFail, onSuccess, MASTER_BOX, type SrsCard } from '../engine/srs';

export type Screen = 'home' | 'map' | 'missions' | 'bag' | 'profile' | 'play' | 'results';
export type PlayTarget = { mode: 'level'; levelId: string } | { mode: 'echoes' };

export interface ChestLoot {
  tier: 'common' | 'rare' | 'epic';
  coins: number;
  items: Partial<Record<ItemId, number>>;
  skin?: string;
}

export interface RunSummary {
  target: PlayTarget;
  correctFirstTry: number;
  total: number;
  maxCombo: number;
  xp: number;
  coins: number;
  timeBonus: number;
  echoesCleared: number;
  bossWon?: boolean;
  bossDamage?: number;
}

export interface RunResult extends RunSummary {
  stars: number;
  accuracy: number;
  firstClear: boolean;
  failed: boolean;
  totalXp: number;
  totalCoins: number;
  chest?: ChestLoot;
  levelUp?: { from: number; to: number };
  streakUp?: number;
  newAchievements: string[];
  unlockedLevel?: string;
}

export interface Toast {
  id: number;
  icon: string;
  title: string;
  text: string;
}

interface Persisted {
  onboarded: boolean;
  name: string;
  skin: string;
  pet: string;
  xp: number;
  coins: number;
  streak: number;
  bestStreak: number;
  lastPlayDay: string | null;
  levels: Record<string, { stars: number; completed: boolean }>;
  bossWounds: Record<string, number>;
  srs: Record<string, SrsCard>;
  mastered: number;
  stats: {
    correct: number;
    answered: number;
    bestCombo: number;
    levelsDone: number;
    chests: number;
    perfects: number;
    bossWins: number;
    coinsEarned: number;
  };
  missions: { day: string; list: MissionState[]; chestClaimed: boolean };
  items: Record<ItemId, number>;
  pets: string[];
  skins: string[];
  achievements: Record<string, number>;
  recent: boolean[];
  settings: { sound: boolean; voice: boolean };
}

interface Volatile {
  screen: Screen;
  target: PlayTarget | null;
  result: RunResult | null;
  toasts: Toast[];
  mapFocus: string | null;
  runId: number;
}

interface Actions {
  go: (s: Screen) => void;
  finishOnboarding: (name: string) => void;
  newDay: () => void;
  play: (t: PlayTarget) => void;
  answer: (phraseId: string, correct: boolean, opts: { isEcho: boolean; isRetry: boolean; combo: number }) => void;
  finishRun: (s: RunSummary) => void;
  claimMission: (id: string) => ChestLoot | null;
  claimDailyChest: () => ChestLoot | null;
  buyItem: (id: ItemId) => boolean;
  buyPet: (id: string) => boolean;
  buySkin: (id: string) => boolean;
  setPet: (id: string) => void;
  setSkin: (id: string) => void;
  useItem: (id: ItemId) => boolean;
  dismissToast: (id: number) => void;
  toggleSetting: (k: 'sound' | 'voice') => void;
  reset: () => void;
}

export type GameState = Persisted & Volatile & Actions;

const initial = (): Persisted => ({
  onboarded: false,
  name: '',
  skin: 'aurora',
  pet: 'pip',
  xp: 0,
  coins: 50,
  streak: 0,
  bestStreak: 0,
  lastPlayDay: null,
  levels: {},
  bossWounds: {},
  srs: {},
  mastered: 0,
  stats: { correct: 0, answered: 0, bestCombo: 0, levelsDone: 0, chests: 0, perfects: 0, bossWins: 0, coinsEarned: 0 },
  missions: { day: dayKey(), list: dailyMissions(dayKey()), chestClaimed: false },
  items: { hint: 2, time: 1, freeze: 0 },
  pets: ['pip'],
  skins: ['aurora'],
  achievements: {},
  recent: [],
  settings: { sound: true, voice: true },
});

// localStorage can throw (private mode, sandboxed iframes): never let it crash the game.
const memory = new Map<string, string>();
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
};

let toastId = 1;

export function rollChest(tier: ChestLoot['tier']): ChestLoot {
  const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  if (tier === 'epic') return { tier, coins: r(150, 220), items: { hint: 2, time: 1, freeze: 1 } };
  if (tier === 'rare') return { tier, coins: r(70, 120), items: { hint: 1, [Math.random() < 0.5 ? 'time' : 'freeze']: 1 } };
  return { tier, coins: r(30, 60), items: Math.random() < 0.6 ? { hint: 1 } : { time: 1 } };
}

export const isLevelUnlocked = (levels: Persisted['levels'], levelId: string) => {
  const idx = WORLD1.levels.findIndex((l) => l.id === levelId);
  return idx === 0 || !!levels[WORLD1.levels[idx - 1]?.id]?.completed;
};

export const currentLevel = (levels: Persisted['levels']) =>
  WORLD1.levels.find((l) => !levels[l.id]?.completed) ?? WORLD1.levels[WORLD1.levels.length - 1];

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const bumpMission = (kind: MissionKind, value: number, mode: 'add' | 'max' = 'add') => {
        const m = get().missions;
        set({
          missions: {
            ...m,
            list: m.list.map((x) =>
              x.kind !== kind || x.claimed
                ? x
                : { ...x, progress: Math.min(x.target, mode === 'add' ? x.progress + value : Math.max(x.progress, value)) },
            ),
          },
        });
      };

      const applyLoot = (loot: ChestLoot) => {
        const s = get();
        const items = { ...s.items };
        for (const [k, v] of Object.entries(loot.items)) items[k as ItemId] += v ?? 0;
        const skins = loot.skin && !s.skins.includes(loot.skin) ? [...s.skins, loot.skin] : s.skins;
        set({
          coins: s.coins + loot.coins,
          items,
          skins,
          stats: { ...s.stats, chests: s.stats.chests + 1, coinsEarned: s.stats.coinsEarned + loot.coins },
        });
      };

      const checkAchievements = (): string[] => {
        const s = get();
        const lvl = levelFromXp(s.xp).level;
        const has: Record<string, boolean> = {
          first: s.stats.levelsDone >= 1,
          streak3: s.streak >= 3,
          streak7: s.streak >= 7,
          combo10: s.stats.bestCombo >= 10,
          perfect: s.stats.perfects >= 1,
          echo10: s.mastered >= 10,
          boss: s.stats.bossWins >= 1,
          pets: s.pets.length >= 2,
          rich: s.coins >= 500,
          lvl5: lvl >= 5,
          chests: s.stats.chests >= 5,
          valley: !!s.levels[WORLD1.levels[19].id]?.completed,
        };
        const fresh = ACHIEVEMENTS.filter((a) => has[a.id] && !s.achievements[a.id]);
        if (!fresh.length) return [];
        const now = Date.now();
        set({
          achievements: { ...s.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, now])) },
          toasts: [
            ...s.toasts,
            ...fresh.map((a) => ({ id: toastId++, icon: a.icon, title: '¡Logro desbloqueado!', text: a.name })),
          ],
        });
        return fresh.map((a) => a.id);
      };

      return {
        ...initial(),
        screen: 'home',
        target: null,
        result: null,
        toasts: [],
        mapFocus: null,
        runId: 0,

        go: (screen) => set({ screen }),

        finishOnboarding: (name) => set({ onboarded: true, name: name.trim() || 'Portador', screen: 'home' }),

        newDay: () => {
          const s = get();
          const today = dayKey();
          const patch: Partial<Persisted> = {};
          if (s.missions.day !== today) {
            patch.missions = { day: today, list: dailyMissions(today), chestClaimed: false };
          }
          if (s.lastPlayDay && s.streak > 0) {
            const gap = daysBetween(s.lastPlayDay, today);
            if (gap > 1) {
              const missed = gap - 1;
              if (s.items.freeze >= missed) {
                patch.items = { ...s.items, freeze: s.items.freeze - missed };
                patch.lastPlayDay = dayKey(new Date(Date.now() - 86400000));
                set({ toasts: [...s.toasts, { id: toastId++, icon: '🛡️', title: 'Racha protegida', text: 'Tu Escudo de racha salvó la llama.' }] });
              } else {
                patch.streak = 0;
              }
            }
          }
          set(patch);
        },

        play: (target) => set({ target, screen: 'play', result: null, runId: get().runId + 1 }),

        answer: (phraseId, correct, { isEcho, isRetry, combo }) => {
          const s = get();
          const now = Date.now();
          const srs = { ...s.srs };
          let mastered = s.mastered;
          if (!correct) {
            srs[phraseId] = onFail(srs[phraseId], now);
          } else if (isEcho && !isRetry && srs[phraseId]) {
            const next = onSuccess(srs[phraseId], now);
            if (next) srs[phraseId] = next;
            else {
              delete srs[phraseId];
              mastered++;
            }
          }
          set({
            srs,
            mastered,
            recent: isRetry ? s.recent : [...s.recent, correct].slice(-30),
            stats: {
              ...s.stats,
              answered: s.stats.answered + 1,
              correct: s.stats.correct + (correct ? 1 : 0),
              bestCombo: Math.max(s.stats.bestCombo, combo),
            },
          });
          if (correct) bumpMission('correct', 1);
          if (correct && isEcho && !isRetry) bumpMission('echoes', 1);
          bumpMission('combo', combo, 'max');
        },

        finishRun: (sum) => {
          const s = get();
          const today = dayKey();
          const accuracy = sum.total ? sum.correctFirstTry / sum.total : 0;
          const petPerk = PETS.find((p) => p.id === s.pet)?.perk;
          const level = sum.target.mode === 'level' ? WORLD1.levels.find((l) => l.id === (sum.target as { levelId: string }).levelId) : undefined;
          const failed = level?.kind === 'boss' && !sum.bossWon;
          const prev = level ? s.levels[level.id] : undefined;
          const firstClear = !!level && !failed && !prev?.completed;
          const stars = failed ? 0 : starsFor(accuracy);

          let xp = sum.xp + (firstClear ? 30 : 0) + (stars === 3 ? 15 : 0);
          let coins = sum.coins + sum.timeBonus + (firstClear ? 25 : 0);
          if (petPerk === 'xp') xp = Math.round(xp * 1.15);
          if (petPerk === 'coins') coins = Math.round(coins * 1.15);

          let chest: ChestLoot | undefined;
          if (level && firstClear && (level.kind === 'chest' || level.kind === 'boss')) {
            chest = rollChest(level.kind === 'boss' ? 'epic' : 'rare');
            if (level.n === 20) chest.skin = 'night';
          }

          const fromLvl = levelFromXp(s.xp).level;
          const toLvl = levelFromXp(s.xp + xp).level;

          // Streak: playing any run counts for today.
          let streak = s.streak;
          let streakUp: number | undefined;
          if (!failed && s.lastPlayDay !== today) {
            streak = s.lastPlayDay && daysBetween(s.lastPlayDay, today) === 1 ? s.streak + 1 : 1;
            streakUp = streak;
          }

          const levels = { ...s.levels };
          if (level && !failed) {
            levels[level.id] = { completed: true, stars: Math.max(prev?.stars ?? 0, stars) };
          }
          const bossWounds = { ...s.bossWounds };
          if (level?.kind === 'boss') {
            if (failed) bossWounds[level.id] = Math.min(4, (bossWounds[level.id] ?? 0) + Math.max(1, Math.floor((sum.bossDamage ?? 0) / 2)));
            else delete bossWounds[level.id];
          }

          set({
            xp: s.xp + xp,
            coins: s.coins + coins,
            streak,
            bestStreak: Math.max(s.bestStreak, streak),
            lastPlayDay: failed ? s.lastPlayDay : today,
            levels,
            bossWounds,
            stats: {
              ...s.stats,
              levelsDone: s.stats.levelsDone + (level && !failed ? 1 : 0),
              perfects: s.stats.perfects + (level && !failed && accuracy === 1 ? 1 : 0),
              bossWins: s.stats.bossWins + (level?.kind === 'boss' && sum.bossWon ? 1 : 0),
              coinsEarned: s.stats.coinsEarned + coins,
            },
          });
          if (chest) applyLoot(chest);

          if (level && !failed) bumpMission('levels', 1);
          if (level && stars === 3) bumpMission('stars3', 1);
          if (level?.kind === 'timed') bumpMission('timed', 1);
          bumpMission('coins', coins);

          const newAchievements = checkAchievements();
          const nextLevel = level ? WORLD1.levels[level.n] : undefined;
          set({
            screen: 'results',
            mapFocus: firstClear && nextLevel ? nextLevel.id : level?.id ?? null,
            result: {
              ...sum,
              stars,
              accuracy,
              firstClear,
              failed,
              totalXp: xp,
              totalCoins: coins,
              chest,
              levelUp: toLvl > fromLvl ? { from: fromLvl, to: toLvl } : undefined,
              streakUp,
              newAchievements,
              unlockedLevel: firstClear ? nextLevel?.id : undefined,
            },
          });
        },

        claimMission: (id) => {
          const s = get();
          const m = s.missions.list.find((x) => x.id === id);
          if (!m || m.claimed || m.progress < m.target) return null;
          set({
            coins: s.coins + m.reward,
            stats: { ...s.stats, coinsEarned: s.stats.coinsEarned + m.reward },
            missions: { ...s.missions, list: s.missions.list.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
          });
          checkAchievements();
          return { tier: 'common', coins: m.reward, items: {} };
        },

        claimDailyChest: () => {
          const s = get();
          if (s.missions.chestClaimed || !s.missions.list.every((m) => m.claimed)) return null;
          const loot = rollChest('rare');
          set({ missions: { ...s.missions, chestClaimed: true } });
          applyLoot(loot);
          checkAchievements();
          return loot;
        },

        buyItem: (id) => {
          const s = get();
          const it = ITEMS.find((i) => i.id === id);
          if (!it || s.coins < it.price) return false;
          set({ coins: s.coins - it.price, items: { ...s.items, [id]: s.items[id] + 1 } });
          return true;
        },
        buyPet: (id) => {
          const s = get();
          const p = PETS.find((x) => x.id === id);
          if (!p || s.pets.includes(id) || s.coins < p.price) return false;
          set({ coins: s.coins - p.price, pets: [...s.pets, id], pet: id });
          checkAchievements();
          return true;
        },
        buySkin: (id) => {
          const s = get();
          const k = SKINS.find((x) => x.id === id);
          if (!k || s.skins.includes(id) || s.coins < k.price) return false;
          set({ coins: s.coins - k.price, skins: [...s.skins, id], skin: id });
          return true;
        },
        setPet: (id) => get().pets.includes(id) && set({ pet: id }),
        setSkin: (id) => get().skins.includes(id) && set({ skin: id }),
        useItem: (id) => {
          const s = get();
          if (s.items[id] <= 0) return false;
          set({ items: { ...s.items, [id]: s.items[id] - 1 } });
          return true;
        },
        dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
        toggleSetting: (k) => set({ settings: { ...get().settings, [k]: !get().settings[k] } }),
        reset: () => set({ ...initial(), screen: 'home', target: null, result: null, toasts: [], mapFocus: null }),
      };
    },
    {
      name: 'lumora-save-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { screen, target, result, toasts, mapFocus, runId, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as unknown as Persisted;
      },
    },
  ),
);

export { MASTER_BOX };
