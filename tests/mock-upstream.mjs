// Fake OpenAI + Anthropic upstream for end-to-end tests of the real server code.
import { createServer } from 'node:http';
import { readFileSync, appendFileSync } from 'node:fs';
// A short valid MP3 is generated on the fly by the runner (ffmpeg) or any MP3 passed as argv[3].
const TONE = readFileSync(process.argv[3]);
const LOG = process.argv[2];
let mode = 'ok'; // ok | 401 | 500
const tr = (src, tgt, translation, extra = {}) => ({ source_language: src, target_language: tgt, translation, register: 'informal', tone: 'sarcastic', literal_translation: null, real_meaning: 'Mock: significado real.', expressions: [], alternatives: [], notes: null, ...extra });
createServer(async (req, res) => {
  let body = Buffer.alloc(0);
  for await (const c of req) body = Buffer.concat([body, c]);
  if (req.url === '/control') { mode = body.toString(); res.end('mode=' + mode); return; }
  const ct = req.headers['content-type'] || '';
  const json = ct.includes('json') ? JSON.parse(body.toString() || '{}') : null;
  appendFileSync(LOG, JSON.stringify({ url: req.url, auth: req.headers.authorization ? 'bearer' : req.headers['x-api-key'] ? 'x-api-key' : 'none', body: json ?? { bytes: body.length, ct } }) + '\n');
  if (mode !== 'ok') { res.writeHead(Number(mode), { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: { message: 'mock failure', type: 'authentication_error' } })); return; }
  if (req.url === '/v1/audio/speech') { setTimeout(() => { res.writeHead(200, { 'content-type': 'audio/mpeg' }); res.end(TONE); }, 300); return; }
  if (req.url === '/v1/audio/transcriptions') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ text: 'I think we want different things.' })); return; }
  if (req.url === '/v1/messages') {
    const text = json.messages[0].content;
    const out = text.includes('Ya te vale') ? tr('es', 'en', "Come on, that's not cool.") : tr('en', 'es', 'Genial, justo lo que me hacía falta hoy.', { literal_translation: 'Oh, eso es justo lo que necesitaba hoy.' });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'msg_mock', type: 'message', role: 'assistant', model: json.model, content: [{ type: 'text', text: JSON.stringify(out) }], stop_reason: 'end_turn', stop_details: null, usage: { input_tokens: 10, output_tokens: 10 } }));
    return;
  }
  if (req.url === '/v1/chat/completions') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(tr('en', 'es', 'Mock OpenAI translation')) } }] }));
    return;
  }
  res.writeHead(404); res.end();
}).listen(Number(process.env.MOCK_PORT || 9999), () => console.log('mock ready'));
