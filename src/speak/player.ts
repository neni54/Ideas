// SIDEYE SPEAK · player and navigation state.
// Playback uses ONLY the device's speech synthesis (no HTTP request, no API key).
import { create } from 'zustand';
import { NativeVoiceError, browserSpeak, canBrowserSpeak, cancelBrowserSpeech } from '../audio/speech';
import { stop as stopAppAudio, unlockAudio } from '../audio/voice';

interface PlayerState {
  /** Key of what is being read (a phrase, a chat line, a voice sample). */
  key: string | null;
  status: 'idle' | 'loading' | 'playing';
  error: string | null;
}
export const useSpeakPlayer = create<PlayerState>(() => ({ key: null, status: 'idle', error: null }));
let token = 0;

/** Reads `text` with the chosen device voice. Tapping the same key again stops it. */
export async function say(key: string, text: string, opts: { slow?: boolean; voiceId?: string; rate?: number } = {}) {
  const st = useSpeakPlayer.getState();
  if (st.key === key && st.status !== 'idle') return hush();
  const my = ++token;
  unlockAudio();
  stopAppAudio();
  if (!canBrowserSpeak()) {
    useSpeakPlayer.setState({ key, status: 'idle', error: 'Este navegador no puede leer en voz alta. Prueba en Safari (iPhone) o Chrome (Android).' });
    return;
  }
  useSpeakPlayer.setState({ key, status: 'loading', error: null });
  try {
    await browserSpeak(text, !!opts.slow, { onStart: () => my === token && useSpeakPlayer.setState({ status: 'playing' }) }, { voiceId: opts.voiceId, rate: opts.rate });
    if (my === token) useSpeakPlayer.setState({ key: null, status: 'idle' });
  } catch (e) {
    if (my === token) useSpeakPlayer.setState({ key: null, status: 'idle', error: e instanceof NativeVoiceError ? e.message : 'No se pudo reproducir la voz del dispositivo.' });
  }
}

export function hush() {
  token++;
  cancelBrowserSpeech();
  useSpeakPlayer.setState({ key: null, status: 'idle' });
}

/* ───── which SPEAK view is open ───── */
export type SpeakView = { name: 'hub' } | { name: 'voices' } | { name: 'practice'; ids?: string[] } | { name: 'chat'; id: string };
export const useSpeakNav = create<{ view: SpeakView; open: (v: SpeakView) => void }>((set) => ({
  view: { name: 'hub' },
  open: (view) => {
    hush();
    set({ view });
  },
}));
