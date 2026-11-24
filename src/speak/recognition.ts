// SIDEYE SPEAK · speech recognition with the browser's own engine (Web Speech API).
// SIDEYE never records, stores or uploads audio here: it only receives the text the browser
// recognised. (The browser's engine is the browser maker's: Chrome may use Google's servers and
// Safari uses Apple's dictation. We say so in the app; the typed answer is always available.)
import { useSpeakPrefs } from './voices';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Rec = any;

const Ctor = (): (new () => Rec) | null =>
  typeof window === 'undefined' ? null : ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null);

/** The API exists in this browser. It may still fail (iPhone home-screen apps, no permission…). */
export const recognitionExists = () => !!Ctor();

/** What the UI should offer: the microphone, or only the typed answer. */
export function recognitionUsable(): boolean {
  if (!recognitionExists()) return false;
  return useSpeakPrefs.getState().recognition !== 'failed';
}

export type ListenError = 'denied' | 'unavailable' | 'no-speech' | 'aborted';

export interface ListenResult {
  /** Best transcripts first (the browser's alternatives). */
  alternatives: string[];
}

export interface Listening {
  /** Resolves with what was said, or rejects with a ListenError. */
  done: Promise<ListenResult>;
  /** Stop listening and keep what was heard so far. */
  stop: () => void;
  /** Cancel without a result. */
  abort: () => void;
}

/** Friendly Spanish explanation for each case (never the browser's technical code). */
export const LISTEN_MESSAGES: Record<ListenError, string> = {
  denied: 'Sin permiso para usar el micrófono. Puedes escribir la frase, o permitir el micrófono en Ajustes del iPhone → Safari → Micrófono.',
  unavailable: 'El reconocimiento de voz no está disponible en este navegador. Escribe la frase y te la comparo igual.',
  'no-speech': 'No he oído nada. Acércate al micrófono e inténtalo otra vez.',
  aborted: '',
};

/**
 * Starts listening in en-US. Must be called from a tap (browsers require a user gesture).
 * `onInterim` receives the partial text while the person speaks.
 */
export function listen(onInterim?: (text: string) => void): Listening {
  const C = Ctor();
  let rec: Rec = null;
  let finalText = '';
  let alts: string[] = [];
  let settled = false;
  let resolveFn!: (r: ListenResult) => void;
  let rejectFn!: (e: ListenError) => void;
  const done = new Promise<ListenResult>((res, rej) => {
    resolveFn = res;
    rejectFn = rej;
  });
  const finish = (err?: ListenError) => {
    if (settled) return;
    settled = true;
    clearTimeout(cap);
    const text = (finalText || alts[0] || '').trim();
    if (err && !text) return rejectFn(err);
    if (!text) return rejectFn('no-speech');
    // It produced words: this device's recognition works.
    useSpeakPrefs.getState().setRecognition('works');
    resolveFn({ alternatives: alts.length ? alts : [text] });
  };
  // Hard cap so the mic never stays open by accident.
  const cap = window.setTimeout(() => {
    try {
      rec?.stop();
    } catch {
      /* already stopped */
    }
    setTimeout(() => finish('no-speech'), 800);
  }, 15_000);

  if (!C) {
    queueMicrotask(() => finish('unavailable'));
    return { done, stop: () => undefined, abort: () => undefined };
  }
  try {
    rec = new C();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript + ' ';
          alts = Array.from({ length: r.length }, (_, k) => String(r[k].transcript || '').trim()).filter(Boolean);
        } else interim += r[0].transcript;
      }
      onInterim?.((finalText + interim).trim());
      if (!alts.length && interim) alts = [interim.trim()];
    };
    rec.onerror = (e: any) => {
      const code = String(e?.error || '');
      if (code === 'not-allowed') return finish('denied');
      if (code === 'service-not-allowed' || code === 'network' || code === 'language-not-supported' || code === 'audio-capture') {
        // Typical of iPhone home-screen apps and offline Chrome: remember it and offer typing.
        if (!finalText && !alts.length) useSpeakPrefs.getState().setRecognition('failed');
        return finish('unavailable');
      }
      if (code === 'aborted') return finish('aborted');
      finish('no-speech');
    };
    rec.onend = () => finish();
    rec.start();
  } catch {
    useSpeakPrefs.getState().setRecognition('failed');
    queueMicrotask(() => finish('unavailable'));
  }
  return {
    done,
    stop: () => {
      try {
        rec?.stop();
      } catch {
        finish();
      }
    },
    abort: () => {
      try {
        rec?.abort();
      } catch {
        /* ignore */
      }
      finish('aborted');
    },
  };
}
