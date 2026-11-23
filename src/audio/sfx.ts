// Tiny synthesized sound effects (no audio files needed).
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

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, slideTo?: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
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
  tap: () => on() && tone(660, 0, 0.06, 'triangle', 0.08),
  correct: () => {
    if (!on()) return;
    tone(784, 0, 0.12, 'triangle');
    tone(1046, 0.09, 0.22, 'triangle');
  },
  combo: () => {
    if (!on()) return;
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.06, 0.14, 'triangle', 0.14));
  },
  wrong: () => {
    if (!on()) return;
    tone(330, 0, 0.16, 'sine', 0.14);
    tone(262, 0.12, 0.24, 'sine', 0.12);
  },
  coin: () => {
    if (!on()) return;
    tone(988, 0, 0.07, 'square', 0.06);
    tone(1319, 0.06, 0.16, 'square', 0.06);
  },
  hit: () => on() && tone(220, 0, 0.18, 'sawtooth', 0.1, 80),
  chest: () => {
    if (!on()) return;
    [523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, i * 0.08, 0.3, 'triangle', 0.13));
  },
  levelUp: () => {
    if (!on()) return;
    [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.1, 0.25, 'triangle', 0.14));
  },
  tick: () => on() && tone(1200, 0, 0.03, 'square', 0.03),
};
