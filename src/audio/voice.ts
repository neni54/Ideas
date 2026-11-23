// The app's single audio engine for English speech.
// - Real AI voice from /api/tts (OpenAI neural TTS with tone instructions), cached per clip.
// - One <audio> element and a play token: a new request always cancels the previous one (no double playback).
// - Pause / resume / replay, slow mode, sequences (a whole conversation), loading and error states.
// - If the AI voice is unavailable, an explicitly labelled browser-voice fallback (can be disabled).
import { create } from 'zustand';
import { ApiError, fetchSpeech, type Tone } from '../services/api';
import { useGame } from '../store/game';
import { browserSpeak, canBrowserSpeak, cancelBrowserSpeech } from './speech';

export interface Clip {
  text: string;
  tone?: Tone;
  slow?: boolean;
  voice?: 'main' | 'partner';
}

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface AudioState {
  key: string | null;
  label: string;
  status: AudioStatus;
  source: 'ai' | 'browser' | null;
  error: string | null;
  fallbackReason: string | null;
  index: number;
  total: number;
}

export const useAudio = create<AudioState>(() => ({
  key: null,
  label: '',
  status: 'idle',
  source: null,
  error: null,
  fallbackReason: null,
  index: 0,
  total: 0,
}));

const set = (p: Partial<AudioState>) => useAudio.setState(p);

let el: HTMLAudioElement | null = null;
let token = 0;
let lastClips: Clip[] = [];
let lastKey = '';
let lastLabel = '';
const urlCache = new Map<string, Promise<string>>();

const clipKey = (c: Clip) => JSON.stringify([c.text, c.tone ?? 'casual', !!c.slow, c.voice ?? 'main']);
export const keyFor = (clips: Clip[]) => clips.map(clipKey).join('|');

function audio(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = 'auto';
  }
  return el;
}

function getUrl(c: Clip): Promise<string> {
  const k = clipKey(c);
  let p = urlCache.get(k);
  if (!p) {
    p = fetchSpeech(c.text, c.tone ?? 'casual', !!c.slow, c.voice ?? 'main').then((b) => URL.createObjectURL(b));
    urlCache.set(k, p);
    p.catch(() => urlCache.delete(k)); // never cache failures
  }
  return p;
}

function playUrl(url: string, my: number): Promise<void> {
  const a = audio();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      a.onended = null;
      a.onerror = null;
      a.onplaying = null;
    };
    a.onplaying = () => my === token && set({ status: 'playing' });
    a.onended = () => {
      cleanup();
      resolve();
    };
    a.onerror = () => {
      cleanup();
      reject(new Error('El navegador no pudo reproducir el audio.'));
    };
    a.src = url;
    a.currentTime = 0;
    a.play().catch((e: Error) => {
      cleanup();
      reject(e.name === 'NotAllowedError' ? new Error('El navegador ha bloqueado el audio. Toca el botón de nuevo.') : e);
    });
  });
}

function aiUnavailable(e: unknown) {
  return e instanceof ApiError && ['offline', 'no_server', 'not_configured', 'provider_auth', 'provider_unreachable', 'http_502', 'http_503'].includes(e.code);
}

export function stop() {
  token++;
  const a = el;
  if (a) {
    a.pause();
    a.removeAttribute('src');
  }
  cancelBrowserSpeech();
  set({ status: 'idle', key: null, error: null, index: 0, total: 0 });
}

/** Plays one clip or a sequence. Must be called from a user gesture (or right after one). */
export async function play(clips: Clip[], label = clips[0]?.text ?? '') {
  if (!clips.length) return;
  const my = ++token;
  const key = keyFor(clips);
  lastClips = clips;
  lastKey = key;
  lastLabel = label;
  const a = audio();
  a.pause();
  cancelBrowserSpeech();
  set({ key, label, status: 'loading', error: null, index: 0, total: clips.length, source: 'ai' });

  // Prefetch the whole sequence so a conversation flows without gaps.
  const urls = clips.map((c) => getUrl(c));
  urls.forEach((p) => p.catch(() => undefined));

  for (let i = 0; i < clips.length; i++) {
    if (my !== token) return;
    set({ index: i, status: 'loading' });
    try {
      const url = await urls[i];
      if (my !== token) return;
      await playUrl(url, my);
    } catch (e) {
      if (my !== token) return;
      if (aiUnavailable(e) && useGame.getState().settings.browserVoiceFallback && canBrowserSpeak()) {
        set({ fallbackReason: (e as Error).message });
        return playWithBrowser(clips.slice(i), my, i);
      }
      set({ status: 'error', error: (e as Error).message });
      return;
    }
  }
  if (my === token) set({ status: 'idle', index: 0 });
}

async function playWithBrowser(clips: Clip[], my: number, offset: number) {
  set({ source: 'browser', status: 'loading' });
  try {
    for (let i = 0; i < clips.length; i++) {
      if (my !== token) return;
      set({ index: offset + i });
      await browserSpeak(clips[i].text, !!clips[i].slow, { onStart: () => my === token && set({ status: 'playing' }) });
    }
    if (my === token) set({ status: 'idle' });
  } catch (e) {
    if (my === token) set({ status: 'error', error: (e as Error).message });
  }
}

export function pause() {
  const s = useAudio.getState();
  if (s.status !== 'playing') return;
  if (s.source === 'browser') speechSynthesis.pause();
  else audio().pause();
  set({ status: 'paused' });
}

export function resume() {
  const s = useAudio.getState();
  if (s.status !== 'paused') return;
  if (s.source === 'browser') {
    speechSynthesis.resume();
    set({ status: 'playing' });
  } else
    audio()
      .play()
      .then(() => set({ status: 'playing' }))
      .catch((e: Error) => set({ status: 'error', error: e.message }));
}

export const replay = () => lastClips.length && play(lastClips, lastLabel);
export const lastPlayedKey = () => lastKey;

/** One button, three behaviours: play, pause, resume. */
export function toggle(clips: Clip[], label?: string) {
  const s = useAudio.getState();
  const key = keyFor(clips);
  if (s.key === key && s.status === 'playing') return pause();
  if (s.key === key && s.status === 'paused') return resume();
  if (s.key === key && s.status === 'loading') return stop();
  return play(clips, label);
}
