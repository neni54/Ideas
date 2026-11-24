// Cloud save for the published artifact (claude.ai `db` + `user` capabilities).
// - Each tester's full save lives at data/users/<id>/save: private to that person.
// - A small progress summary goes to testers/<id> so the owner (and editors) can follow testers.
// - Outside claude.ai (own server, local dev) `window.claude` does not exist: localStorage only.
import { create } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import { levelFromXp } from '../engine/progression';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;
type User = any;
interface Ctx {
  db: Db;
  user: User;
  uid: string;
}

export type CloudState = 'off' | 'connecting' | 'synced' | 'saving' | 'local-only' | 'error';
export const useCloud = create<{ state: CloudState; message: string; savedAt: number | null }>(() => ({ state: 'off', message: '', savedAt: null }));
const setCloud = (p: Partial<ReturnType<typeof useCloud.getState>>) => useCloud.setState(p);

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'timeout' })), ms))]);

let ctxPromise: Promise<Ctx | null> | null = null;
export function cloud(): Promise<Ctx | null> {
  if (!ctxPromise) {
    ctxPromise = (async () => {
      const claude = (window as any).claude;
      if (!claude?.use) return null;
      setCloud({ state: 'connecting' });
      const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
      if (!db || !user) return null;
      const uid = await user.id();
      if (!uid) return null;
      return { db, user, uid } as Ctx;
    })()
      .catch(() => null)
      .then((c) => {
        if (!c) setCloud({ state: 'off', message: '' });
        return c;
      });
  }
  return ctxPromise;
}

/* ───── local fallback ───── */

const memory = new Map<string, string>();
export const localStore: StateStorage = {
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

/* ───── summary the owner can see ───── */

function summary(json: string) {
  const s = JSON.parse(json)?.state ?? {};
  const cards = Object.values(s.cards ?? {}) as { box: number }[];
  const st = s.stats ?? {};
  return {
    heroName: String(s.name ?? '').slice(0, 40),
    level: levelFromXp(s.xp ?? 0).level,
    xp: s.xp ?? 0,
    streak: s.streak ?? 0,
    sessions: st.sessions ?? 0,
    answered: st.answered ?? 0,
    correct: st.correct ?? 0,
    phrases: cards.length,
    mastered: cards.filter((c) => c.box >= 5).length,
    packsPlayed: Object.values(s.packs ?? {}).filter((p: any) => p?.plays > 0).length,
    lastPlayDay: s.lastPlayDay ?? null,
    updatedAt: Date.now(),
  };
}

/* ───── debounced, one-at-a-time cloud writer ───── */

let pending: string | null = null;
let writing = false;
let timer: number | null = null;
let blocked = false;

async function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (writing || pending === null || blocked) return;
  const c = await cloud();
  if (!c) return;
  const value = pending;
  pending = null;
  writing = true;
  setCloud({ state: 'saving' });
  try {
    await c.db.doc(`data/users/${c.uid}/save`).set({ json: value, v: 1, updatedAt: Date.now() });
    await c.db.doc(`testers/${c.uid}`).set(summary(value)).catch(() => undefined); // best effort
    setCloud({ state: 'synced', savedAt: Date.now(), message: '' });
  } catch (e: any) {
    if (e?.code === 'invalid_argument') {
      blocked = true;
      setCloud({
        state: 'local-only',
        message: 'Tu acceso a esta página es de solo lectura, así que el progreso se guarda únicamente en este navegador. Pide a quien te la compartió acceso de "Colaborador".',
      });
    } else if (e?.code === 'quota_exceeded') {
      setCloud({ state: 'error', message: 'El almacenamiento de la página está lleno. Tu progreso sigue guardado en este navegador.' });
    } else {
      pending = pending ?? value; // retry with the newest value later
      setCloud({ state: 'error', message: 'No se pudo guardar en la nube. Se reintentará automáticamente.' });
      timer = window.setTimeout(flush, 8000);
    }
  } finally {
    writing = false;
    if (pending !== null && !blocked && !timer) timer = window.setTimeout(flush, 1500);
  }
}

if (typeof window !== 'undefined') {
  const now = () => void flush();
  window.addEventListener('pagehide', now);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && now());
}

/** zustand persist storage: cloud first (when available), always mirrored to the browser. */
export const cloudStorage: StateStorage = {
  getItem: async (name) => {
    const local = await localStore.getItem(name);
    const c = await cloud();
    if (!c) return local;
    try {
      const snap: any = await withTimeout<any>(c.db.doc(`data/users/${c.uid}/save`).get(), 10_000);
      const remote = snap?.exists ? (snap.data()?.json as string | undefined) : undefined;
      setCloud({ state: 'synced', savedAt: snap?.exists ? Number(snap.data()?.updatedAt) || null : null });
      if (remote) return remote;
      // First visit with cloud saving: upload whatever this browser already had.
      if (local) {
        pending = local;
        timer = window.setTimeout(flush, 500);
      }
      return local;
    } catch {
      setCloud({ state: 'error', message: 'No se pudo leer tu progreso de la nube; usando el de este navegador.' });
      return local;
    }
  },
  setItem: (name, value) => {
    localStore.setItem(name, value);
    if (blocked) return;
    pending = value;
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(flush, 1500);
  },
  removeItem: (name) => localStore.removeItem(name),
};

/* ───── owner view of testers ───── */

export interface TesterRow {
  id: string;
  name: string;
  heroName: string;
  level: number;
  xp: number;
  streak: number;
  sessions: number;
  answered: number;
  correct: number;
  phrases: number;
  mastered: number;
  packsPlayed: number;
  lastPlayDay: string | null;
  updatedAt: number;
}

/** Subscribes to testers' summaries when the viewer may see them (owner/editors). Returns unsubscribe. */
export async function watchTesters(onRows: (rows: TesterRow[] | null) => void): Promise<() => void> {
  const c = await cloud();
  if (!c) {
    onRows(null);
    return () => undefined;
  }
  const allowed = await c.user.canEdit().catch(() => false);
  if (!allowed) {
    onRows(null);
    return () => undefined;
  }
  return c.db.collection('testers').onSnapshot(
    async (snap: any) => {
      const docs = snap.docs.filter((d: any) => d.exists);
      const ids = docs.map((d: any) => d.id);
      const profiles = ids.length ? await c.user.profiles(ids).catch(() => ({})) : {};
      onRows(
        docs
          .map((d: any) => ({ id: d.id, name: profiles[d.id]?.name || '', ...(d.data() as object) }) as TesterRow)
          .sort((a: TesterRow, b: TesterRow) => b.updatedAt - a.updatedAt),
      );
    },
    () => onRows(null),
  );
}
