import { useGame } from '../store/game';

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  voice =
    voices.find((v) => /en[-_]US/i.test(v.lang) && /Samantha|Google|Natural|Aria|Jenny/i.test(v.name)) ??
    voices.find((v) => /^en[-_]/i.test(v.lang)) ??
    null;
  return voice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = pickVoice;
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, opts: { force?: boolean; slow?: boolean } = {}) {
  if (!canSpeak()) return;
  if (!opts.force && !useGame.getState().settings.voice) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = opts.slow ? 0.65 : 0.92;
    const v = voice ?? pickVoice();
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch {
    /* speech is a nice-to-have */
  }
}
