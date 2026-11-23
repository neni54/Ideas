// Browser speech synthesis — used ONLY as a clearly labelled fallback when the AI voice is unavailable.
// Fixes over the previous version: waits for the voice list, avoids the cancel()+speak() race that
// made Chrome drop the utterance, and reports errors instead of swallowing them.

export const canBrowserSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

function voices(): Promise<SpeechSynthesisVoice[]> {
  const now = speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

export function cancelBrowserSpeech() {
  if (canBrowserSpeak()) speechSynthesis.cancel();
}

/** Speaks text with the best English voice the device has. Resolves when finished. */
export async function browserSpeak(text: string, slow: boolean, hooks: { onStart?: () => void } = {}): Promise<void> {
  if (!canBrowserSpeak()) throw new Error('Este navegador no tiene síntesis de voz.');
  const list = await voices();
  const en = list.filter((v) => /^en[-_]/i.test(v.lang));
  if (!en.length) throw new Error('Este dispositivo no tiene ninguna voz en inglés instalada.');
  const voice =
    en.find((v) => /en[-_]US/i.test(v.lang) && /Natural|Neural|Google|Samantha|Aria|Jenny|Ava/i.test(v.name)) ?? en.find((v) => /en[-_]US/i.test(v.lang)) ?? en[0];
  speechSynthesis.cancel();
  // Give the engine a tick after cancel(): speaking immediately is silently dropped by some Chrome versions.
  await new Promise((r) => setTimeout(r, 60));
  return new Promise((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = slow ? 0.7 : 0.95;
    u.onstart = () => hooks.onStart?.();
    u.onend = () => resolve();
    u.onerror = (e) => (e.error === 'interrupted' || e.error === 'canceled' ? resolve() : reject(new Error(`La voz del navegador falló (${e.error}).`)));
    speechSynthesis.speak(u);
  });
}
