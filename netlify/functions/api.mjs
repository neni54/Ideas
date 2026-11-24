// SIDEYE AI endpoints as a Netlify Function (test version on Netlify).
// Same routes, limits and errors as server/index.mjs, reusing server/providers.mjs, so the
// keys (OPENAI_API_KEY, ANTHROPIC_API_KEY) stay on Netlify and never reach the phone.
import { createHash, timingSafeEqual } from 'node:crypto';
import { ProviderError, TONES, speech, status, transcribe, translate } from '../../server/providers.mjs';

export const config = { path: '/api/*' };

const CORS_ORIGINS = new Set(['capacitor://localhost', 'ionic://localhost', ...(process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)]);
const ACCESS_CODE = (process.env.ACCESS_CODE || '').trim();
const digest = (v) => createHash('sha256').update(String(v)).digest();
const hasAccess = (req) => !ACCESS_CODE || timingSafeEqual(digest(req.headers.get('x-access-code') || ''), digest(ACCESS_CODE));

const json = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra } });
const bad = (message) => json(400, { error: { code: 'bad_request', message } });

/** Per-instance rate limit (each warm function instance counts on its own). */
const buckets = new Map();
function limited(req, context, key, perMinute) {
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || '?';
  const id = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(id) ?? { n: 0, t: now };
  if (now - b.t > 60_000) Object.assign(b, { n: 0, t: now });
  b.n++;
  buckets.set(id, b);
  return b.n > perMinute;
}

/** Short-lived memory cache of generated voice clips while the instance is warm. */
const ttsCache = new Map();

async function readJson(req) {
  const text = await req.text();
  if (text.length > 64 * 1024) throw new ProviderError(413, 'too_large', 'La petición es demasiado grande.');
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new ProviderError(400, 'bad_request', 'JSON no válido.');
  }
}

async function route(req, context, path) {
  if (path === '/api/status' && req.method === 'GET') return json(200, { ...status(), access: ACCESS_CODE ? 'code' : 'open', host: 'netlify' });
  if (!hasAccess(req)) return json(401, { error: { code: 'access_required', message: 'Esta versión de prueba necesita un código de acceso.' } });

  if (path === '/api/translate' && req.method === 'POST') {
    if (limited(req, context, 'translate', 20)) return json(429, { error: { code: 'rate_limited', message: 'Demasiadas traducciones seguidas. Espera un minuto.' } });
    const { text, direction = 'auto', context: ctx = '' } = await readJson(req);
    if (typeof text !== 'string' || !text.trim()) return bad('Escribe un texto para traducir.');
    if (text.length > 1000) return bad('El texto es demasiado largo (máximo 1000 caracteres).');
    if (!['auto', 'en-es', 'es-en'].includes(direction)) return bad('Dirección de traducción no válida.');
    return json(200, await translate({ text: text.trim(), direction, context: String(ctx).slice(0, 300).trim() }));
  }

  if (path === '/api/tts' && req.method === 'POST') {
    if (limited(req, context, 'tts', 90)) return json(429, { error: { code: 'rate_limited', message: 'Demasiadas peticiones de audio. Espera un minuto.' } });
    const { text, tone = 'casual', slow = false, voice = 'main' } = await readJson(req);
    if (typeof text !== 'string' || !text.trim()) return bad('No hay texto para leer.');
    if (text.length > 400) return bad('El texto es demasiado largo para leerlo (máximo 400 caracteres).');
    if (!(tone in TONES)) return bad('Tono de voz no válido.');
    if (!['main', 'partner'].includes(voice)) return bad('Voz no válida.');
    const key = JSON.stringify([text.trim(), tone, !!slow, voice]);
    let buf = ttsCache.get(key);
    const hit = buf ? 'memory' : 'miss';
    if (!buf) {
      buf = await speech({ text: text.trim(), tone, slow: !!slow, voice });
      ttsCache.set(key, buf);
      if (ttsCache.size > 100) ttsCache.delete(ttsCache.keys().next().value);
    }
    return new Response(buf, { status: 200, headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400', 'X-Cache': hit } });
  }

  if (path === '/api/transcribe' && req.method === 'POST') {
    if (limited(req, context, 'stt', 30)) return json(429, { error: { code: 'rate_limited', message: 'Demasiadas grabaciones seguidas. Espera un minuto.' } });
    const mime = String(req.headers.get('content-type') || '').split(';')[0];
    if (!mime.startsWith('audio/')) return bad('Formato de audio no válido.');
    const audio = Buffer.from(await req.arrayBuffer());
    if (audio.length > 4 * 1024 * 1024) return json(413, { error: { code: 'too_large', message: 'La grabación es demasiado larga.' } });
    if (audio.length < 1000) return bad('La grabación está vacía o es demasiado corta.');
    return json(200, await transcribe({ audio, mime }));
  }

  return json(404, { error: { code: 'not_found', message: 'Ruta no encontrada.' } });
}

export default async (req, context) => {
  const path = new URL(req.url).pathname;
  const origin = req.headers.get('origin');
  const cors = origin && CORS_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Access-Code', 'Access-Control-Max-Age': '86400' } });
  let res;
  try {
    res = await route(req, context, path);
  } catch (e) {
    if (e instanceof ProviderError) res = json(e.status, { error: { code: e.code, message: e.message } });
    else {
      console.error('[api] unexpected error', e);
      res = json(500, { error: { code: 'internal', message: 'Error interno del servidor.' } });
    }
  }
  for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
  return res;
};
