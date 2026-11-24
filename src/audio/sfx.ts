// Discreet synthesized sound design: soft sines, low volume, no arcade bleeps.
import { useGame } from '../store/game';

let ctx: AudioContext | null = null;
const ac = () => {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function tone(freq: number, start: number, dur: number, vol = 0.07, type: OscillatorType = 'sine') {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const on = () => {
  try {
    return useGame.getState().settings.sound;
  } catch {
    return false;
  }
};

export const sfx = {
  tap: () => on() && tone(520, 0, 0.05, 0.025, 'triangle'),
  correct: () => {
    if (!on()) return;
    tone(659, 0, 0.18);
    tone(988, 0.07, 0.28, 0.05);
  },
  streak: () => {
    if (!on()) return;
    [659, 831, 988].forEach((f, i) => tone(f, i * 0.06, 0.3, 0.05));
  },
  wrong: () => on() && tone(220, 0, 0.28, 0.06, 'triangle'),
  unlock: () => {
    if (!on()) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.5, 0.04));
  },
  tick: () => on() && tone(880, 0, 0.03, 0.02, 'square'),
  flip: () => on() && tone(400, 0, 0.08, 0.03, 'triangle'),
};
