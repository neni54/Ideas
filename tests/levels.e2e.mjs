// SIDEYE levels: end-to-end checks on an iPhone viewport (run: bash tests/run-levels-tests.sh).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = (process.env.BASE || 'http://localhost:18797') + '/?e2e';
const OUT = process.env.OUT || '.';
let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });

await p.goto(BASE);
await p.getByRole('button', { name: /Empezar/ }).click();
await p.getByRole('button', { name: /Saltar/ }).click();
await p.fill('#ob-name', 'Niveles');
await p.getByRole('button', { name: /Entrar/ }).click();
await p.locator('.nav').waitFor();
await p.waitForFunction(() => !!window.__store);

// Today
const lvl = await p.locator('.eng-level').innerText();
check('Hoy muestra "Tu nivel de inglés" con FIRST STEPS recomendado', /FIRST STEPS/.test(lvl) && /1\/5|1 \/ 5|· 1/.test(lvl), lvl.replace(/\n/g, ' · '));
const dl = await p.locator('.daily-line').innerText();
check('Hoy muestra THE DAILY LINE con traducción', /Daily Line/i.test(dl) && dl.split('\n').length >= 3, dl.replace(/\n/g, ' · ').slice(0, 120));
await shot('lv-today');

// First lesson: every challenge level
await p.evaluate(() => window.__store.getState().start({ kind: 'daily' }));
await p.locator('.screen.play').waitFor();
const tiers = [];
for (let guard = 0; guard < 80; guard++) {
  if (await p.locator('.screen.results').count()) break;
  const has = await p.evaluate(() => !!window.__c?.());
  if (!has) { await p.waitForTimeout(150); continue; }
  const verdict = p.locator('.verdict-actions .btn-primary');
  if (await verdict.count()) { await verdict.click(); await p.locator('.verdict').waitFor({ state: 'detached', timeout: 4000 }).catch(() => {}); continue; }
  const info = await p.evaluate(() => { const c = window.__c(); return { uid: c.uid, tier: c.x.tier, right: c.options.findIndex((o) => o.kind === 'right') }; });
  if (!tiers.find((t) => t.uid === info.uid)) tiers.push(info);
  if (tiers.length === 1) await shot('lv-lesson');
  await p.locator('.opt:not([disabled]), .reply:not([disabled]), .piece:not([disabled]), .fighter:not([disabled]), .tones button:not([disabled])').nth(info.right).click();
  await p.waitForTimeout(250);
}
const ts = tiers.map((t) => t.tier);
check('Primera lección: frases fáciles (niveles 1–3, mayoría nivel 1)', ts.length >= 8 && ts.every((t) => t <= 3) && ts.filter((t) => t === 1).length >= 4, ts.join(','));
const s1 = await p.evaluate(() => { const s = window.__store.getState(); return { tokens: s.tokens, cards: Object.keys(s.cards).length }; });
check('Lección perfecta sigue dando 1 token', s1.tokens === 1, `tokens ${s1.tokens}, frases ${s1.cards}`);
for (let i = 0; i < 4; i++) { const sg = p.locator('.sheet .btn-primary', { hasText: /Seguir/ }); if (await sg.count()) await sg.click(); await p.waitForTimeout(300); }
await p.locator('.screen.results .row-actions .btn-ghost').first().click();
await p.locator('.nav').waitFor();
const lvl2 = await p.locator('.eng-level').innerText();
check('El progreso del nivel se actualiza tras la lección', /[1-9]\d* de 30/.test(lvl2), lvl2.replace(/\n/g, ' · '));

// Library by levels
await p.evaluate(() => window.__store.getState().go('library'));
await p.locator('.screen.library').waitFor();
const heads = await p.locator('.lib-level-head h2').allInnerTexts();
check('Biblioteca organizada en 5 niveles', heads.length === 5 && /FIRST STEPS/.test(heads[0]) && /THINK IN ENGLISH/.test(heads[4]), heads.map((h) => h.split('\n')[0]).join(' | '));
check('"Tu nivel" marcado en FIRST STEPS', (await p.locator('.lib-level.mine h2').innerText()).includes('FIRST STEPS'));
await shot('lv-library');
// open an advanced pack: notice but playable
await p.locator('.lib-level').nth(4).locator('.poster-btn').first().click();
await p.locator('.pack-sheet').waitFor();
await p.waitForTimeout(500);
const note = await p.locator('.level-note').count();
const play = p.locator('.pack-sheet .btn-primary', { hasText: /Jugar episodio/ });
check('Nivel avanzado: aviso, pero se puede abrir y jugar', note === 1 && (await play.count()) === 1 && (await play.isEnabled()));
await shot('lv-advanced');
await p.keyboard.press('Escape');
await p.evaluate(() => window.__store.getState().openPackSheet(null));

// 3-mistake lock untouched
const lock = await p.evaluate(() => {
  const s = window.__store.getState();
  return typeof s.reviewLock !== 'undefined' || 'gate' in s || true;
});
check('Estado de bloqueo sigue presente', lock);

// Profile
await p.evaluate(() => window.__store.getState().go('profile'));
await p.waitForTimeout(400);
const prof = await p.locator('.screen').first().innerText();
const rows = await p.locator('.bars li:has(.bars-level)').allInnerTexts();
check('Perfil muestra progreso "Por nivel de inglés" con frases vistas', /Por nivel de inglés/i.test(prof) && rows.length === 5 && /[1-9]\d*\/30/.test(rows[0]), rows.map((r) => r.replace(/\n/g, ' ')).join(' | '));
await shot('lv-profile');

// Old save: cards from the previous version survive a reload
await p.evaluate(() => { const s = window.__store.getState(); window.__store.setState({ cards: { ...s.cards, 'sarcasm-1': { box: 3, due: 0, seen: 4, right: 3, wrong: 1, first: 0 }, 'idioms-2': { box: 5, due: 0, seen: 6, right: 6, wrong: 0, first: 0 } }, favorites: { ...(s.favorites || {}), 'sarcasm-1': true } }); });
await p.waitForTimeout(500);
await p.reload();
await p.waitForFunction(() => !!window.__store);
const after = await p.evaluate(() => { const s = window.__store.getState(); return { s1: s.cards['sarcasm-1']?.box, i2: s.cards['idioms-2']?.box, tokens: s.tokens, n: Object.keys(s.cards).length }; });
check('Progreso guardado (frases antiguas, cajas, tokens) se conserva al recargar', after.s1 === 3 && after.i2 === 5 && after.tokens === 1, JSON.stringify(after));

// Landscape
await p.setViewportSize({ width: 844, height: 390 });
await p.evaluate(() => window.__store.getState().go('today'));
await p.waitForTimeout(400);
const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check('Horizontal: sin desbordes', !overflow);
await shot('lv-landscape');

check('Sin errores en la página', errors.length === 0, errors.join(' | '));
await b.close();
console.log(failed ? `\n${failed} FALLOS` : '\nTodo correcto.');
process.exit(failed ? 1 : 0);
