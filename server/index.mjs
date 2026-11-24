// SIDEYE server: serves the built app and the AI endpoints. No API key ever reaches the browser.
//   node --env-file-if-exists=.env server/index.mjs
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProviderError, TONES, config, speech, status, transcribe, translate } from './providers.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const CACHE_DIR = resolve(process.env.TTS_CACHE_DIR || join(ROOT, '.cache', 'tts'));
const PORT = Number(process.env.PORT || 8787);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.mp3': 'audio/mpeg' };

/* ───── helpers ───── */

function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  res.writeHead(status, {
    'Content-Type': isBuf ? 'application/octet-stream' : 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(isBuf ? body : JSON.stringify(body));
}
const fail = (res, e) => {
  if (e instanceof ProviderError) return send(res, e.status, { error: { code: e.code, message: e.message } });
  console.error('[server] unexpected error', e);
  return send(res, 500, { error: { code: 'internal', message: 'Error interno del servidor.' } });
};
const bad = (res, message) => send(res, 400, { error: { code: 'bad_request', message } });

async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new ProviderError(413, 'too_large', 'La petición es demasiado grande.');
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}
async function readJson(req) {
  try {
    return JSON.parse((await readBody(req, 64 * 1024)).toString('utf8') || '{}');
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    throw new ProviderError(400, 'bad_request', 'JSON no válido.');
  }
}

/** Tiny per-IP rate limiter to protect the API budget. */
const buckets = new Map();
function limited(req, key, perMinute) {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || '?';
  const id = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(id) ?? { n: 0, t: now };
  if (now - b.t > 60_000) {
    b.n = 0;
    b.t = now;
  }
  b.n++;
  buckets.set(id, b);
  return b.n > perMinute;
}

/* ───── TTS cache: memory + disk, plus in-flight de-duplication ───── */

const memCache = new Map(); // key -> Buffer (LRU-ish)
const inflight = new Map(); // key -> Promise<Buffer>
const MEM_MAX = 200;

async function cachedSpeech(params) {
  const c = config();
  const key = createHash('sha256').update(JSON.stringify([c.ttsModel, params.voice === 'partner' ? c.voices.partner : c.voices.main, params.tone, !!params.slow, params.text])).digest('hex');
  if (memCache.has(key)) {
    const v = memCache.get(key);
    memCache.delete(key);
    memCache.set(key, v);
    return { buf: v, hit: 'memory' };
  }
  const file = join(CACHE_DIR, `${key}.mp3`);
  try {
    const buf = await readFile(file);
    memCache.set(key, buf);
    return { buf, hit: 'disk' };
  } catch {
    /* not cached yet */
  }
  if (inflight.has(key)) return { buf: await inflight.get(key), hit: 'shared' };
  const p = speech(params)
    .then(async (buf) => {
      memCache.set(key, buf);
      if (memCache.size > MEM_MAX) memCache.delete(memCache.keys().next().value);
      try {
        await mkdir(CACHE_DIR, { recursive: true });
        await writeFile(file, buf);
      } catch (e) {
        console.warn('[server] could not write TTS cache', e.message);
      }
      return buf;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return { buf: await p, hit: 'miss' };
}

/* ───── routes ───── */

async function api(req, res, path) {
  if (path === '/api/status' && req.method === 'GET') return send(res, 200, status());

  if (path === '/api/translate' && req.method === 'POST') {
    if (limited(req, 'translate', 20)) return send(res, 429, { error: { code: 'rate_limited', message: 'Demasiadas traducciones seguidas. Espera un minuto.' } });
    const { text, direction = 'auto', context = '' } = await readJson(req);
    if (typeof text !== 'string' || !text.trim()) return bad(res, 'Escribe un texto para traducir.');
    if (text.length > 1000) return bad(res, 'El texto es demasiado largo (máximo 1000 caracteres).');
    if (!['auto', 'en-es', 'es-en'].includes(direction)) return bad(res, 'Dirección de traducción no válida.');
    const result = await translate({ text: text.trim(), direction, context: String(context).slice(0, 300).trim() });
    return send(res, 200, result);
  }

  if (path === '/api/tts' && req.method === 'POST') {
    if (limited(req, 'tts', 90)) return send(res, 429, { error: { code: 'rate_limited', message: 'Demasiadas peticiones de audio. Espera un minuto.' } });
    const { text, tone = 'casual', slow = false, voice = 'main' } = await readJson(req);
    if (typeof text !== 'string' || !text.trim()) return bad(res, 'No hay texto para leer.');
    if (text.length > 400) return bad(res, 'El texto es demasiado largo para leerlo (máximo 400 caracteres).');
    if (!(tone in TONES)) return bad(res, 'Tono de voz no válido.');
    if (!['main', 'partner'].includes(voice)) return bad(res, 'Voz no válida.');
    const { buf, hit } = await cachedSpeech({ text: text.trim(), tone, slow: !!slow, voice });
    return send(res, 200, buf, { 'Content-Type': 'audio/mpeg', 'Content-Length': String(buf.length), 'Cache-Control': 'private, max-age=86400', 'X-Cache': hit });
  }

  if (path === '/api/transcribe' && req.method === 'POST') {
    if (limited(req, 'stt', 30)) return send(res, 429, { error: { code: 'rate_limited', message: 'Demasiadas grabaciones seguidas. Espera un minuto.' } });
    const mime = String(req.headers['content-type'] || '').split(';')[0];
    if (!mime.startsWith('audio/')) return bad(res, 'Formato de audio no válido.');
    const audio = await readBody(req, 6 * 1024 * 1024);
    if (audio.length < 1000) return bad(res, 'La grabación está vacía o es demasiado corta.');
    return send(res, 200, await transcribe({ audio, mime }));
  }

  return send(res, 404, { error: { code: 'not_found', message: 'Ruta no encontrada.' } });
}

async function staticFile(req, res, path) {
  const safe = normalize(decodeURIComponent(path)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, safe);
  if (!file.startsWith(DIST)) return send(res, 403, { error: { code: 'forbidden', message: 'Prohibido.' } });
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(DIST, 'index.html'); // SPA fallback
  }
  try {
    const buf = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Cache-Control': file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
    res.end(buf);
  } catch {
    send(res, 404, { error: { code: 'not_built', message: 'No hay build: ejecuta "npm run build" o usa "npm run dev".' } });
  }
}

const server = createServer(async (req, res) => {
  const path = (req.url || '/').split('?')[0];
  try {
    if (path.startsWith('/api/')) await api(req, res, path);
    else await staticFile(req, res, path);
  } catch (e) {
    fail(res, e);
  }
});

server.listen(PORT, () => {
  const s = status();
  console.log(`SIDEYE server on http://localhost:${PORT}`);
  console.log(`  translate: ${s.translate.ready ? `ready (${s.translate.provider})` : `NOT CONFIGURED - set ${s.translate.missing}`}`);
  console.log(`  voice:     ${s.tts.ready ? `ready (${s.tts.model})` : `NOT CONFIGURED - set ${s.tts.missing}`}`);
  console.log(`  speech recognition: ${s.stt.ready ? `ready (${s.stt.model})` : `NOT CONFIGURED - set ${s.stt.missing}`}`);
});
