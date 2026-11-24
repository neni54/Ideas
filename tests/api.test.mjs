import { readFileSync } from 'node:fs';
const LOGFILE = process.argv[2];
const M = 'http://localhost:18788', N = 'http://localhost:18789';
let pass = 0, fail = 0;
const U = ' #' + Date.now().toString(36);
const ok = (name, cond, info = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
const post = (base, path, body, headers = { 'content-type': 'application/json' }) => fetch(base + path, { method: 'POST', headers, body: typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body) });
const log = () => readFileSync(LOGFILE, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const ctl = (m) => fetch('http://localhost:19999/control', { method: 'POST', body: m });
await new Promise((r) => setTimeout(r, 800));

// status
let s = await (await fetch(M + '/api/status')).json();
ok('status (mock-configured) reports all services ready', s.translate.ready && s.tts.ready && s.stt.ready, JSON.stringify(s.translate));
s = await (await fetch(N + '/api/status')).json();
ok('status (no keys) reports missing variables', !s.translate.ready && s.translate.missing === 'ANTHROPIC_API_KEY' && s.tts.missing === 'OPENAI_API_KEY');
ok('status never exposes key values', !JSON.stringify(s).includes('test-'));

// translation
let r = await post(M, '/api/translate', { text: "Oh, that's just what I needed today.", direction: 'auto', context: 'mi compañero, tras un atasco' });
let j = await r.json();
ok('translate EN→ES returns structured result', r.status === 200 && j.translation && j.source_language === 'en' && j.provider === 'anthropic', j.translation);
let up = log().filter((e) => e.url === '/v1/messages').pop();
ok('Claude request: model claude-opus-5-5, JSON schema output, fallbacks, key in header', up.body.model === 'claude-opus-5-5' && up.body.output_config?.format?.type === 'json_schema' && up.body.fallbacks === 'default' && up.auth !== 'none');
ok('Claude request carries user context and system prompt', up.body.messages[0].content.includes('tras un atasco') && up.body.system.includes('Spain'));
r = await post(M, '/api/translate', { text: 'Ya te vale, tío.', direction: 'es-en' });
j = await r.json();
ok('translate ES→EN', r.status === 200 && j.target_language === 'en', j.translation);
r = await post(M, '/api/translate', { text: '   ' });
ok('empty text → 400 with message', r.status === 400 && (await r.json()).error.message.length > 5);
r = await post(M, '/api/translate', { text: 'x'.repeat(1001) });
ok('too long text → 400', r.status === 400);
r = await post(N, '/api/translate', { text: 'hello' });
j = await r.json();
ok('translate without key → 503 not_configured with exact variable', r.status === 503 && j.error.code === 'not_configured' && j.error.message.includes('ANTHROPIC_API_KEY'), j.error.message);

// TTS + caching
const before = log().filter((e) => e.url === '/v1/audio/speech').length;
r = await post(M, '/api/tts', { text: "That's just perfect." + U, tone: 'sarcastic' });
let buf = Buffer.from(await r.arrayBuffer());
ok('tts returns audio/mpeg (cache miss)', r.status === 200 && r.headers.get('content-type') === 'audio/mpeg' && buf.length > 1000 && r.headers.get('x-cache') === 'miss', `${buf.length} bytes`);
r = await post(M, '/api/tts', { text: "That's just perfect." + U, tone: 'sarcastic' });
await r.arrayBuffer();
ok('same clip again served from cache', r.headers.get('x-cache') === 'memory');
const tts = log().filter((e) => e.url === '/v1/audio/speech');
ok('provider called once for two identical requests', tts.length - before === 1);
const last = tts.pop();
ok('TTS request: gpt-4o-mini-tts, mp3, American voice + sarcastic delivery instructions', last.body.model === 'gpt-4o-mini-tts' && last.body.response_format === 'mp3' && /American English/.test(last.body.instructions) && /sarcastic/i.test(last.body.instructions) && last.auth === 'bearer');
r = await post(M, '/api/tts', { text: "That's just perfect." + U, tone: 'sarcastic', slow: true });
await r.arrayBuffer();
const slowReq = log().filter((e) => e.url === '/v1/audio/speech').pop();
ok('slow version is a separate take with learner pacing', r.headers.get('x-cache') === 'miss' && /slower than normal/.test(slowReq.body.instructions));
const n0 = log().filter((e) => e.url === '/v1/audio/speech').length;
const many = await Promise.all([1, 2, 3, 4].map(() => post(M, '/api/tts', { text: 'Tell me about it.' + U, tone: 'casual' })));
await Promise.all(many.map((x) => x.arrayBuffer()));
ok('4 concurrent identical requests → 1 provider call', log().filter((e) => e.url === '/v1/audio/speech').length - n0 === 1, many.map((x) => x.headers.get('x-cache')).join(','));
for (const tone of ['enthusiastic', 'warm', 'dry', 'indifferent', 'hurt', 'curious', 'suspicious', 'nervous', 'serious']) {
  r = await post(M, '/api/tts', { text: 'Good for you.' + U, tone });
  await r.arrayBuffer();
  const sent = log().filter((e) => e.url === '/v1/audio/speech').pop();
  ok(`Voice Acting tone "${tone}" accepted and sent as acting instructions`, r.status === 200 && sent.body.instructions.toLowerCase().includes(tone === 'indifferent' ? 'bored' : tone === 'curious' ? 'curious' : tone === 'serious' ? 'grave' : tone === 'hurt' ? 'hurt' : tone === 'dry' ? 'deadpan' : tone === 'warm' ? 'warm' : tone === 'nervous' ? 'nervous' : tone === 'suspicious' ? 'suspicious' : 'delighted'));
}
r = await post(M, '/api/tts', { text: 'Hi', tone: 'shouty' });
ok('invalid tone → 400', r.status === 400);
r = await post(M, '/api/tts', { text: 'Hi' + U, voice: 'partner' });
await r.arrayBuffer();
ok('partner voice uses a different voice id', log().filter((e) => e.url === '/v1/audio/speech').pop().body.voice === 'ash');

// provider failures
await ctl('401');
r = await post(M, '/api/tts', { text: 'Brand new sentence.' + U });
j = await r.json();
ok('provider rejects key → 503 provider_auth, clear Spanish message', r.status === 503 && j.error.code === 'provider_auth', j.error.message);
r = await post(M, '/api/translate', { text: 'Brand new sentence.' + U });
j = await r.json();
ok('translator with rejected key → 503 provider_auth', r.status === 503 && j.error.code === 'provider_auth', j.error.message);
await ctl('500');
r = await post(M, '/api/tts', { text: 'Another new one.' + U });
j = await r.json();
ok('provider 500 → 502 provider_error', r.status === 502 && j.error.code === 'provider_error');
await ctl('ok');
r = await post(M, '/api/tts', { text: 'Brand new sentence.' + U });
await r.arrayBuffer();
ok('failures are not cached: retry succeeds after provider recovers', r.status === 200);

// transcription
const audio = readFileSync(process.argv[3]);
r = await post(M, '/api/transcribe', audio, { 'content-type': 'audio/mpeg' });
j = await r.json();
ok('transcribe returns text', r.status === 200 && j.text.length > 0, j.text);
const stt = log().filter((e) => e.url === '/v1/audio/transcriptions').pop();
ok('STT request is multipart to /audio/transcriptions', stt.body.ct.startsWith('multipart/form-data'));
r = await post(M, '/api/transcribe', 'tiny', { 'content-type': 'audio/webm' });
ok('empty recording → 400', r.status === 400);
r = await post(N, '/api/transcribe', audio, { 'content-type': 'audio/mpeg' });
ok('transcribe without key → 503 not_configured', r.status === 503);

// static + SPA
r = await fetch(M + '/library');
ok('server serves the app (SPA fallback)', r.status === 200 && (await r.text()).includes('<div id="root">'));
r = await fetch(M + '/../../etc/passwd');
ok('no path traversal', !(await r.text()).includes('root:'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
