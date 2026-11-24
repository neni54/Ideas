// SIDEYE SPEAK · device voices (SpeechSynthesis). No network: only the voices installed on the device.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { canBrowserSpeak } from '../audio/speech';

export interface DeviceVoice {
  id: string; // voiceURI (stable per device)
  name: string;
  lang: string;
  /** Shown to the user: "Femenina · Samantha", "Masculina · Alex" or "Voice 3". */
  label: string;
  gender: 'female' | 'male' | null;
  group: 'us' | 'other-en';
  local: boolean;
}

/*
 * Gender only for voice names we know for certain (Apple, Google, Microsoft English voices).
 * Any other voice is shown as "Voice N": we never invent a gender.
 */
const FEMALE = new Set(['samantha', 'ava', 'allison', 'susan', 'victoria', 'zoe', 'nicky', 'joelle', 'kathy', 'karen', 'moira', 'tessa', 'kate', 'serena', 'fiona', 'veena', 'stephanie', 'martha', 'catherine', 'aria', 'jenny', 'zira', 'michelle', 'ana', 'emma', 'libby', 'sonia', 'natasha', 'clara', 'molly', 'hazel', 'susan', 'heather', 'linda', 'eva', 'ashley', 'sara', 'nancy', 'amber', 'cora', 'elizabeth', 'jane', 'monica']);
const MALE = new Set(['alex', 'daniel', 'fred', 'tom', 'aaron', 'evan', 'nathan', 'rishi', 'oliver', 'arthur', 'gordon', 'lee', 'reed', 'rocko', 'ralph', 'junior', 'guy', 'david', 'mark', 'george', 'ryan', 'eric', 'christopher', 'roger', 'steffan', 'andrew', 'brian', 'william', 'thomas', 'liam', 'connor', 'james', 'davis', 'jason', 'tony', 'jacob', 'brandon']);
/** Novelty/effect voices (macOS/iOS): not useful for learning English, never listed. */
const NOVELTY = new Set(['albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'good news', 'jester', 'organ', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox', 'deranged', 'hysterical', 'pipe organ', 'princess']);

/** "Microsoft Aria Online (Natural) - English (United States)" → "Aria"; "Samantha (Enhanced)" → "Samantha". */
function baseName(name: string) {
  return name
    .replace(/^(Microsoft|Google|Apple)\s+/i, '')
    .replace(/\s*[-–(].*$/, '')
    .replace(/\s+(Online|Desktop|Natural)$/i, '')
    .trim();
}
/** Natural-sounding voices first; the old synthetic/robotic voices (still real voices) go last. */
const NICE = ['samantha', 'ava', 'allison', 'susan', 'zoe', 'nicky', 'aaron', 'evan', 'nathan', 'tom', 'joelle', 'noelle', 'aria', 'jenny', 'guy', 'michelle', 'emma', 'andrew', 'brian'];
const ROBOTIC = new Set(['fred', 'rocko', 'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'sandy', 'shelley', 'ralph', 'kathy', 'junior', 'albert']);
const quality = (name: string) => {
  const key = baseName(name).toLowerCase();
  if (ROBOTIC.has(key)) return -1;
  return (/Premium|Enhanced|Natural|Neural|Online/i.test(name) ? 2 : 0) + (NICE.includes(key) ? 1 : 0);
};
const niceRank = (name: string) => {
  const i = NICE.indexOf(baseName(name).toLowerCase());
  return i < 0 ? 99 : i;
};

export const voicesNow = (): SpeechSynthesisVoice[] => (canBrowserSpeak() ? speechSynthesis.getVoices() : []);

/** English voices on this device, en-US first, best quality first, with honest labels. */
export function englishVoices(list = voicesNow()): DeviceVoice[] {
  const seen = new Set<string>();
  const en = list
    .filter((v) => /^en([-_]|$)/i.test(v.lang))
    .filter((v) => !NOVELTY.has(baseName(v.name).toLowerCase()) && !NOVELTY.has(v.name.toLowerCase()))
    .filter((v) => (seen.has(v.voiceURI) ? false : (seen.add(v.voiceURI), true)))
    .sort((a, b) => {
      const us = (v: SpeechSynthesisVoice) => (/^en[-_]US$/i.test(v.lang) ? 0 : 1);
      return us(a) - us(b) || quality(b.name) - quality(a.name) || niceRank(a.name) - niceRank(b.name) || a.name.localeCompare(b.name);
    });
  let n = 0;
  return en.map((v) => {
    const base = baseName(v.name);
    const key = base.toLowerCase();
    const gender = FEMALE.has(key) ? 'female' : MALE.has(key) ? 'male' : null;
    const accent = /^en[-_]US$/i.test(v.lang) ? '' : ` · ${accentOf(v.lang)}`;
    const label = gender ? `${gender === 'female' ? 'Femenina' : 'Masculina'} · ${base}${accent}` : `Voice ${++n}${accent}`;
    return { id: v.voiceURI, name: v.name, lang: v.lang, label, gender, group: /^en[-_]US$/i.test(v.lang) ? 'us' : 'other-en', local: v.localService };
  });
}

function accentOf(lang: string) {
  const r = lang.split(/[-_]/)[1]?.toUpperCase();
  return { GB: 'Reino Unido', AU: 'Australia', IE: 'Irlanda', IN: 'India', ZA: 'Sudáfrica', CA: 'Canadá', NZ: 'Nueva Zelanda', SC: 'Escocia' }[r ?? ''] ?? lang;
}

/** Waits for the voice list (iOS and Chrome load it asynchronously). Never rejects. */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!canBrowserSpeak()) return Promise.resolve([]);
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

/* ───── user preferences (this device only) ───── */

export const SPEAK_PREFS_KEY = 'sideye-speak-v1';

interface SpeakPrefs {
  /** voiceURI chosen by the user; null = automatic (best en-US voice). */
  voiceId: string | null;
  rate: number;
  /** Read the other person's lines aloud in conversations. */
  autoRead: boolean;
  /** Result of the last real attempt to use speech recognition on this device. */
  recognition: 'untested' | 'works' | 'failed';
  setVoice: (id: string | null) => void;
  setRate: (r: number) => void;
  setAutoRead: (v: boolean) => void;
  setRecognition: (r: SpeakPrefs['recognition']) => void;
}

export const useSpeakPrefs = create<SpeakPrefs>()(
  persist(
    (set) => ({
      voiceId: null,
      rate: 0.95,
      autoRead: true,
      recognition: 'untested',
      setVoice: (voiceId) => set({ voiceId }),
      setRate: (rate) => set({ rate }),
      setAutoRead: (autoRead) => set({ autoRead }),
      setRecognition: (recognition) => set({ recognition }),
    }),
    {
      name: SPEAK_PREFS_KEY,
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return sessionStorage;
        }
      }),
      partialize: (s) => ({ voiceId: s.voiceId, rate: s.rate, autoRead: s.autoRead, recognition: s.recognition }),
    },
  ),
);

/** The voice to use: the user's choice if this device still has it, else the best English one. */
export function chosenVoice(list = voicesNow()): SpeechSynthesisVoice | null {
  const { voiceId } = useSpeakPrefs.getState();
  const mine = voiceId ? list.find((v) => v.voiceURI === voiceId) : undefined;
  if (mine) return mine;
  const best = englishVoices(list)[0];
  return best ? list.find((v) => v.voiceURI === best.id) ?? null : null;
}
