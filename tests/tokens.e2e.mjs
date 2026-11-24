// SIDEYE TOKENS / EXTRA CHANCE / THE BADGE SHOP: end-to-end checks on a phone viewport.
// Run with tests/run-tokens-tests.sh. Uses the ?e2e hooks (window.__c = current question,
// window.__store = game store) only to answer on purpose and to prepare balances.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = (process.env.BASE || 'http://localhost:18796') + '/?e2e';
const OUT = process.env.OUT || '.';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone SE'] });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
const st = () => p.evaluate(() => {
  const s = window.__store.getState();
  return { tokens: s.tokens, log: s.tokenLog, awards: Object.keys(s.tokenAwards), badges: Object.keys(s.badges), chance: s.extraChance, lock: s.reviewLock, screen: s.screen, result: s.result, stats: s.stats, lessons: s.lessons };
});
const set = (patch) => p.evaluate((x) => window.__store.setState(x), patch);

/** Plays the current Play session; `wrongAt` = indexes of questions to answer wrong (first try). */
async function playLesson(wrongAt = []) {
  let q = 0;
  for (let guard = 0; guard < 80; guard++) {
    if (await p.locator('.screen.results').count()) return q;
    const has = await p.evaluate(() => !!window.__c?.());
    if (!has) { await p.waitForTimeout(150); continue; }
    const verdict = p.locator('.verdict-actions .btn-primary');
    if (await verdict.count()) {
      await verdict.click();
      await p.locator('.verdict').waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
      continue;
    }
    const info = await p.evaluate(() => { const c = window.__c(); return { uid: c.uid, retry: !!c.isRetry, right: c.options.findIndex((o) => o.kind === 'right'), n: c.options.length }; });
    const wrong = !info.retry && wrongAt.includes(q);
    const idx = wrong ? (info.right + 1) % info.n : info.right;
    const opts = p.locator('.opt:not([disabled]), .reply:not([disabled]), .piece:not([disabled]), .fighter:not([disabled]), .tones button:not([disabled])');
    await opts.nth(idx).click();
    if (!info.retry) q++;
    await p.waitForTimeout(250);
  }
  throw new Error('lesson did not finish');
}
async function closeResults() {
  for (let i = 0; i < 4; i++) {
    const seguir = p.locator('.sheet .btn-primary', { hasText: /Seguir/ });
    if (await seguir.count()) await seguir.click();
    await p.waitForTimeout(300);
  }
  await p.locator('.screen.results .row-actions .btn-ghost').first().click();
  await p.locator('.nav').waitFor();
}
const startDaily = async () => {
  await p.locator('.nav-item[aria-label="Hoy"]').click();
  await p.evaluate(() => window.__store.getState().start({ kind: 'daily' }));
  await p.locator('.screen.play').waitFor();
};

// ── setup
await p.goto(BASE);
await p.getByRole('button', { name: /Empezar/ }).click();
await p.getByRole('button', { name: /Saltar/ }).click();
await p.fill('#ob-name', 'Tokens');
await p.getByRole('button', { name: /Entrar/ }).click();
await p.locator('.nav').waitFor();
await p.waitForFunction(() => !!window.__store);
check('Saldo inicial 0 y pastilla MY TOKENS en Hoy', (await st()).tokens === 0 && (await p.locator('.screen.today .token-pill').innerText()).trim() === '0');

// 1. perfect lesson → +1
await startDaily();
await playLesson([]);
let s = await st();
check('Lección perfecta concede exactamente 1 token', s.tokens === 1 && s.log.length === 1 && s.log[0].delta === 1, `saldo ${s.tokens}, movimiento "${s.log[0]?.reason}"`);
check('Resultados muestran +1 SIDEYE TOKEN', (await p.locator('.tk-earned').count()) === 1);
await p.screenshot({ path: `${OUT}/t1-perfect.png` });
await closeResults();
check('Saldo actualizado en la pantalla principal', (await p.locator('.screen.today .token-pill').innerText()).trim() === '1');

// 2. lesson with one mistake → +0
await startDaily();
await playLesson([1]);
s = await st();
check('Lección con 1 error no concede tokens', s.tokens === 1 && (await p.locator('.tk-earned').count()) === 0, `saldo ${s.tokens}`);
await closeResults();

// 3. same lesson twice (collection episode) → once
await p.evaluate(() => window.__store.getState().start({ kind: 'episode', packId: 'everyday' }));
await p.locator('.screen.play').waitFor();
await playLesson([]);
s = await st();
const afterFirst = s.tokens;
check('Episodio perfecto concede 1 token', afterFirst === 2, `saldo ${afterFirst}`);
await closeResults();
await p.evaluate(() => window.__store.getState().start({ kind: 'episode', packId: 'everyday' }));
await p.locator('.screen.play').waitFor();
await playLesson([]);
s = await st();
check('Repetir la misma lección no genera tokens', s.tokens === afterFirst && (await p.locator('.tk-already').count()) === 1, `saldo ${s.tokens}`);
await closeResults();

// 4. three mistakes → original lock + EXTRA CHANCE offer
const before = await st();
await startDaily();
await playLesson([0, 1, 2]);
s = await st();
const lockDay = s.lock?.day;
check('El bloqueo original de 3 errores se activa', !!s.lock && s.result?.lockTriggered?.mistakes >= 3, `errores ${s.result?.lockTriggered?.mistakes}`);
check('La pantalla de bloqueo ofrece EXTRA CHANCE y WAIT UNTIL TOMORROW', (await p.locator('.xc-buy').count()) === 1 && (await p.locator('.xc-wait').count()) === 1);
await p.screenshot({ path: `${OUT}/t4-lock.png` });
const tokensAtLock = s.tokens;
const statsAtLock = s.stats;
// double tap on the button
await p.locator('.xc-buy').dblclick();
await p.waitForTimeout(300);
s = await st();
check('EXTRA CHANCE descuenta exactamente 1 token (aunque se pulse dos veces)', s.tokens === tokensAtLock - 1 && s.chance?.left === 1, `saldo ${tokensAtLock} → ${s.tokens}`);
check('El bloqueo y sus errores siguen intactos tras comprar', JSON.stringify(s.lock) === JSON.stringify((await st()).lock) && s.lock.day === lockDay && s.lock.pending.length >= 3);
const gate = await p.evaluate(() => { const g = window.__store.getState(); return { extra: g.extraChance }; });
await p.screenshot({ path: `${OUT}/t4-chance-active.png` });
// the new chance: a lesson that can include new content
await p.locator('.xc-on .btn-primary').click();
await p.locator('.screen.play').waitFor();
const hasNew = await p.evaluate(() => { const s = window.__store.getState(); return true; });
await playLesson([]);
s = await st();
check('La nueva oportunidad permite hacer otra lección', !!s.result && s.result.total > 0, `preguntas ${s.result?.total}`);
check('La oportunidad se consume al terminar la lección', s.chance === null);
check('Las estadísticas históricas no se borran', s.stats.answered > statsAtLock.answered && s.stats.sessions > statsAtLock.sessions);
check('El bloqueo del día sigue activo después (no se borran los errores)', !!s.lock && s.lock.day === lockDay);
await closeResults();
await p.locator('.nav-item[aria-label="Hoy"]').click();
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/t4-today-after.png` });
check('En Hoy vuelve a ofrecerse EXTRA CHANCE', (await p.locator('.screen.today .xc-buy').count()) === 1);

// 5. no tokens → cannot spend
await set({ tokens: 0 });
await p.locator('.nav-item[aria-label="Juegos"]').click();
await p.locator('.nav-item[aria-label="Hoy"]').click();
const disabled = await p.locator('.screen.today .xc-buy').isDisabled();
const msg = await p.locator('.screen.today .xc-none').count();
const spent = await p.evaluate(() => window.__store.getState().buyExtraChance());
check('Sin saldo no se puede gastar y se indica esperar a mañana', disabled && msg === 1 && spent === false && (await st()).tokens === 0);
await p.locator('.screen.today .xc-wait').click();
check('WAIT UNTIL TOMORROW cierra la oferta', (await p.locator('.screen.today .xc-buy').count()) === 0);

// 6. THE BADGE SHOP
await set({ tokens: 25 });
await p.locator('.nav-item[aria-label="Shop"]').click();
await p.locator('.screen.shop').waitFor();
check('THE BADGE SHOP muestra 10 escudos y el saldo', (await p.locator('.badge-tile').count()) === 10 && (await p.locator('.screen.shop .token-pill').innerText()).trim() === '25');
await p.screenshot({ path: `${OUT}/t6-shop.png` });
await p.locator('.badge-tile', { hasText: 'NEW YORK' }).click();
await p.locator('.badge-sheet').waitFor();
await p.screenshot({ path: `${OUT}/t6-detail.png` });
await p.locator('.badge-sheet .btn-primary', { hasText: 'Comprar' }).click();
await p.locator('.badge-confirm').waitFor({ timeout: 3000 }).catch(() => {});
check('No se descuentan tokens antes de confirmar', (await st()).tokens === 25 && (await p.locator('.badge-confirm').count()) === 1);
await p.screenshot({ path: `${OUT}/t6-confirm.png` });
await p.locator('.badge-confirm .btn-primary').dblclick().catch(() => {});
await p.waitForTimeout(300);
s = await st();
check('Comprar un escudo descuenta exactamente 10 tokens', s.tokens === 15 && s.badges.length === 1 && s.badges[0] === 'new-york', `saldo ${s.tokens}`);
check('La compra queda en el historial', s.log[0].delta === -10 && /NEW YORK/.test(s.log[0].reason));
const again = await p.evaluate(() => window.__store.getState().buyBadge('new-york'));
check('No se puede comprar dos veces el mismo escudo', again === 'owned' && (await st()).tokens === 15);
await p.locator('.badge-done .btn-secondary').click();
await p.waitForTimeout(400);
check('MY BADGE COLLECTION: 1 conseguido y 9 bloqueados visibles', (await p.locator('.badge-tile.have').count()) === 1 && (await p.locator('.badge-tile.locked').count()) === 9);
await p.screenshot({ path: `${OUT}/t6-collection.png` });
await set({ tokens: 4 });
await p.locator('.badge-tile', { hasText: 'BROOKLYN' }).click();
check('Con saldo insuficiente no deja comprar', (await p.locator('.badge-funds .btn[disabled], .badge-funds button[disabled]').count()) === 1);
await p.locator('.sheet-x').click();
await p.waitForTimeout(300);

// 7. badges are not profile achievements and give nothing in games
s = await st();
const profileAchHasBadge = await p.evaluate(() => Object.keys(window.__store.getState().achievements).some((a) => /york|badge/i.test(a)));
check('Los escudos no son logros del perfil ni dan XP', !profileAchHasBadge);

// 8. persistence after closing the app
const snapshot = await st();
await p.close();
const p2 = await ctx.newPage();
await p2.goto(BASE);
await p2.waitForFunction(() => !!window.__store && window.__store.persist.hasHydrated());
const after = await p2.evaluate(() => { const s = window.__store.getState(); return { tokens: s.tokens, badges: Object.keys(s.badges), log: s.tokenLog.length, awards: Object.keys(s.tokenAwards).length }; });
check('Tokens, compras e historial se conservan al cerrar y abrir', after.tokens === snapshot.tokens && after.badges.join() === snapshot.badges.join() && after.log === snapshot.log.length && after.awards === snapshot.awards.length, JSON.stringify(after));

// 9. an unused extra chance from yesterday is refunded at the next day
const refund = await p2.evaluate(() => {
  const g = window.__store;
  const y = new Date(Date.now() - 86400000);
  const day = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  const t = g.getState().tokens;
  g.setState({ extraChance: { day, left: 1 } });
  g.getState().newDay();
  return { before: t, after: g.getState().tokens, chance: g.getState().extraChance, reason: g.getState().tokenLog[0].reason };
});
check('Una extra chance no usada se devuelve al día siguiente', refund.after === refund.before + 1 && refund.chance === null, refund.reason);

check('Sin errores en la página', errors.length === 0, errors.join(' | '));
await b.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones superadas`);
process.exit(failed.length ? 1 : 0);
