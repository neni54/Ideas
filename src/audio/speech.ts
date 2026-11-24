// Device voice (native speech synthesis: window.speechSynthesis + SpeechSynthesisUtterance).
// This file makes NO network requests: it is the native path, fully separate from the AI voice
// (src/audio/voice.ts → /api/tts). It never needs a server or an API key.

export const canBrowserSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

export class NativeVoiceError extends Error {}

/** Voices the device has right now (may be empty until the browser fires `voiceschanged`). */
const voicesNow = () => (canBrowserSpeak() ? speechSynthesis.getVoices() : []);

/** Waits for the voice list (iOS and Chrome load it asynchronously). Never rejects. */
function loadVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  const now = voicesNow();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(voicesNow());
    };
    speechSynthesis.addEventListener('voiceschanged', finish);
    setTimeout(finish, timeoutMs);
  });
}

// Start loading the list as soon as the app opens, so it is ready by the first tap.
if (canBrowserSpeak()) loadVoices().catch(() => undefined);

const GOOD_US = /Samantha|Ava|Allison|Susan|Zoe|Nicky|Siri|Natural|Neural|Enhanced|Premium|Google US|Aria|Jenny|Guy/i;

/** Voice chosen in SIDEYE SPEAK settings (stored on this device), if any. */
function preferred(): { voiceId: string | null; rate: number } {
  try {
    const st = JSON.parse(localStorage.getItem('sideye-speak-v1') || '{}')?.state ?? {};
    return { voiceId: typeof st.voiceId === 'string' ? st.voiceId : null, rate: typeof st.rate === 'number' ? st.rate : 0.95 };
  } catch {
    return { voiceId: null, rate: 0.95 };
  }
}

/** Best English voice: the user's chosen voice, else a good en-US voice, then any en-US, then any English. */
export function pickEnglishVoice(list: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const pref = preferred().voiceId;
  const mine = pref ? list.find((v) => v.voiceURI === pref) : undefined;
  if (mine) return mine;
  const en = list.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const us = en.filter((v) => /^en[-_]US$/i.test(v.lang));
  return us.find((v) => GOOD_US.test(v.name) && v.localService !== false) ?? us.find((v) => GOOD_US.test(v.name)) ?? us.find((v) => v.default) ?? us[0] ?? en[0] ?? null;
}

/** Name of the voice that will be used, for the player label ("" until the list is known). */
export function nativeVoiceName(): string {
  const v = pickEnglishVoice(voicesNow());
  return v ? v.name.replace(/\s*\(.*\)$/, '') : '';
}

export function cancelBrowserSpeech() {
  if (canBrowserSpeak()) speechSynthesis.cancel();
}
export function pauseBrowserSpeech() {
  if (canBrowserSpeak()) speechSynthesis.pause();
}
export function resumeBrowserSpeech() {
  if (canBrowserSpeak()) speechSynthesis.resume();
}

/**
 * Speaks `text` in English with the device voice. Resolves when it finishes (or is stopped).
 * Call it from a tap: iOS only lets speech start after a user gesture.
 */
export async function browserSpeak(
  text: string,
  slow: boolean,
  hooks: { onStart?: () => void; onBoundary?: (charIndex: number) => void } = {},
  opts: { voiceId?: string; rate?: number } = {},
): Promise<void> {
  if (!canBrowserSpeak()) throw new NativeVoiceError('Este navegador no puede leer en voz alta. Prueba en Safari (iPhone) o Chrome (Android).');
  const list = await loadVoices();
  const voice = (opts.voiceId ? list.find((v) => v.voiceURI === opts.voiceId) : undefined) ?? pickEnglishVoice(list);
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
    // A tick after cancel(): speaking immediately is silently dropped by some engines.
    await new Promise((r) => setTimeout(r, 60));
  }
  return new Promise((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text);
    // Without a voice object, lang alone makes the device use its default American English voice.
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-US';
    const base = opts.rate ?? preferred().rate;
    u.rate = slow ? Math.min(0.7, base) : base;
    let settled = false;
    const end = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      fn();
    };
    // iOS sometimes never fires onend; never leave the player stuck in "playing".
    const watchdog = window.setTimeout(() => end(resolve), 4000 + (text.length * 110) / u.rate);
    u.onstart = () => hooks.onStart?.();
    u.onboundary = (e) => hooks.onBoundary?.(e.charIndex);
    u.onend = () => end(resolve);
    u.onerror = (e) =>
      end(() =>
        e.error === 'interrupted' || e.error === 'canceled'
          ? resolve()
          : reject(new NativeVoiceError(e.error === 'not-allowed' ? 'Toca de nuevo el altavoz para escuchar la frase.' : `La voz del dispositivo falló (${e.error}).`)),
      );
    speechSynthesis.speak(u);
    // iOS: if the engine was paused by a previous pause(), make sure it runs.
    if (speechSynthesis.paused) speechSynthesis.resume();
  });
}
