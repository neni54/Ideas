// Browser side of the AI services. It only talks to our own server (/api/*): no keys here.
import { create } from 'zustand';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}

export type Tone =
  | 'neutral' | 'casual' | 'sarcastic' | 'passive_aggressive' | 'amused' | 'frustrated' | 'confident' | 'flirtatious' | 'surprised' | 'professional' | 'evasive'
  | 'enthusiastic' | 'warm' | 'dry' | 'indifferent' | 'hurt' | 'curious' | 'suspicious' | 'nervous' | 'serious';

export interface ServiceStatus {
  translate: { ready: boolean; provider: string; missing: string | null };
  tts: { ready: boolean; model: string; missing: string | null };
  stt: { ready: boolean; model: string; missing: string | null };
}

export interface Translation {
  source_language: 'en' | 'es';
  target_language: 'en' | 'es';
  translation: string;
  register: string;
  tone: string;
  literal_translation: string | null;
  real_meaning: string;
  expressions: { expression: string; kind: string; meaning: string }[];
  alternatives: { text: string; register: string; note: string }[];
  notes: string | null;
  provider: string;
}

// Web: same origin (''). iOS app (Capacitor): the deployed server, set at build time in .env.production.
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');

const NO_SERVER = API_BASE
  ? 'No se puede conectar con el servidor de SIDEYE. Revisa tu conexión e inténtalo de nuevo.'
  : 'No hay servidor de IA en esta versión. Ejecuta la app con "npm start" (o "npm run dev" + "npm run dev:api") y configura las claves en .env.';

/* ───── optional access code (server ACCESS_CODE) ───── */
const CODE_KEY = 'sideye-access-code';
const readCode = () => {
  try {
    return localStorage.getItem(CODE_KEY) || '';
  } catch {
    return '';
  }
};
let asking: Promise<boolean> | null = null;
/** Asks once for the code, even if several requests fail at the same time. */
function askForCode(): Promise<boolean> {
  if (!asking) {
    asking = Promise.resolve().then(() => {
      const code = window.prompt('Esta versión de prueba de SIDEYE tiene código de acceso.\nEscríbelo para activar la voz y el traductor:')?.trim();
      if (code)
        try {
          localStorage.setItem(CODE_KEY, code);
        } catch {
          /* private mode */
        }
      setTimeout(() => (asking = null), 1000);
      return !!code;
    });
  }
  return asking;
}

async function call(path: string, init: RequestInit, retried = false): Promise<Response> {
  let res: Response;
  try {
    const headers = new Headers(init.headers);
    const code = readCode();
    if (code) headers.set('X-Access-Code', code);
    res = await fetch(API_BASE + path, { ...init, headers });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError('offline', navigator.onLine === false ? 'Sin conexión a internet.' : NO_SERVER);
  }
  if (res.ok) return res;
  let code = 'http_' + res.status;
  let message = `Error del servidor (HTTP ${res.status}).`;
  try {
    const data = await res.json();
    if (data?.error) ({ code, message } = data.error);
    if (code === 'access_required' && !retried && (await askForCode())) return call(path, init, true);
  } catch {
    // Static hosting answers /api/* with HTML (or 404): there is no AI server behind it.
    if (res.status === 404 || res.status === 405) {
      code = 'no_server';
      message = NO_SERVER;
    }
  }
  throw new ApiError(code, message, res.status);
}

/* ───── status (fetched once, shared) ───── */

interface StatusStore {
  status: ServiceStatus | null;
  error: string | null;
  loaded: boolean;
  load: () => Promise<void>;
}
export const useServices = create<StatusStore>((set, get) => ({
  status: null,
  error: null,
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const res = await call('/api/status', { method: 'GET' });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new ApiError('no_server', NO_SERVER);
      set({ status: await res.json(), loaded: true, error: null });
    } catch (e) {
      set({ status: null, loaded: true, error: (e as Error).message });
    }
  },
}));

/* ───── translation ───── */

export async function translateText(text: string, direction: 'auto' | 'en-es' | 'es-en', context: string, signal?: AbortSignal): Promise<Translation> {
  const res = await call('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, direction, context }),
    signal,
  });
  return res.json();
}

/* ───── text to speech ───── */

export async function fetchSpeech(text: string, tone: Tone, slow: boolean, voice: 'main' | 'partner'): Promise<Blob> {
  const res = await call('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, tone, slow, voice }),
  });
  if (!(res.headers.get('content-type') || '').includes('audio')) throw new ApiError('no_server', NO_SERVER);
  return res.blob();
}

/* ───── speech to text ───── */

export async function transcribeAudio(blob: Blob): Promise<string> {
  const res = await call('/api/transcribe', { method: 'POST', headers: { 'Content-Type': blob.type || 'audio/webm' }, body: blob });
  return (await res.json()).text as string;
}
