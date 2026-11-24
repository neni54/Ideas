// Mobile end-to-end test for SIDEYE (run through tests/run-mobile-tests.sh).
// For each phone profile: onboarding, every tab, layout audit (horizontal overflow, small touch
// targets, tiny text), every game mode played to the end, translator, AI voice playback,
// progress persistence after reload, PWA manifest + service worker + offline start.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:18790';
const OUT = process.env.OUT || 'test-results/mobile';
mkdirSync(OUT, { recursive: true });

const PROFILES = [
  { name: 'iPhone SE', full: true },
  { name: 'iPhone 16 Pro Max', full: true },
  { name: 'Pixel 7', full: true },
  { name: 'Galaxy S24', full: false },
  { name: 'iPhone SE landscape', full: false, landscapeGame: true },
  { name: 'Pixel 7 landscape', full: false, landscapeGame: true },
];
const only = process.env.DEVICES?.split(',').map((s) => s.trim());
const TABS = [
  ['today', 'Hoy'],
  ['library', 'Colecciones'],
  ['games', 'Juegos'],
  ['phrases', 'Frases'],
  ['translate', 'Traductor'],
  ['profile', 'Perfil'],
];

const failures = [];
const notes = [];
const fail = (dev, msg) => failures.push(`[${dev}] ${msg}`);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Layout audit of the current screen. */
async function audit(page, dev, where) {
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = { overflow: document.documentElement.scrollWidth - vw, wide: [], small: [], tiny: [] };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return s.visibility !== 'hidden' && s.display !== 'none' && b.width > 0 && b.height > 0 && Number(s.opacity) > 0.05;
    };
    const label = (el) => (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : el.tagName.toLowerCase()) + ` "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`;
    for (const el of document.querySelectorAll('.app *')) {
      if (!visible(el)) continue;
      const b = el.getBoundingClientRect();
      // Elements sticking out of the viewport horizontally (ignoring intentional horizontal scrollers).
      let scroller = false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') { scroller = true; break; }
      }
      if (!scroller && (b.right > vw + 1 || b.left < -1)) out.wide.push(label(el) + ` [${Math.round(b.left)}..${Math.round(b.right)}]`);
      if ((el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') && !el.disabled) {
        if (b.height < 40 || b.width < 40) out.small.push(label(el) + ` ${Math.round(b.width)}x${Math.round(b.height)}`);
      }
      if (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 11) out.tiny.push(label(el) + ` ${fs}px`);
      }
    }
    return out;
  });
  if (r.overflow > 0) fail(dev, `${where}: page scrolls horizontally by ${r.overflow}px`);
  if (r.wide.length) fail(dev, `${where}: elements outside the screen: ${r.wide.slice(0, 5).join(' | ')}`);
  if (r.small.length) notes.push(`[${dev}] ${where}: small touch targets: ${[...new Set(r.small)].slice(0, 8).join(' | ')}`);
  if (r.tiny.length) notes.push(`[${dev}] ${where}: text under 11px: ${[...new Set(r.tiny)].slice(0, 6).join(' | ')}`);
}

async function shot(page, dev, name) {
  await page.screenshot({ path: `${OUT}/${slug(dev)}--${name}.png` });
}

async function onboard(page) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.getByRole('button', { name: /Empezar/ }).click();
  await page.locator('.goal').first().click();
  await page.getByRole('button', { name: /Continuar/ }).click();
  await page.fill('#ob-name', 'Tester');
  await page.getByRole('button', { name: /Entrar/ }).click();
  await page.locator('.nav').waitFor();
}

async function go(page, label) {
  await page.locator(`.nav-item[aria-label="${label}"]`).click();
  await page.waitForTimeout(350);
}

const isVisible = async (loc) => (await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false));

/** Plays whatever game is on screen until it reaches the results screen (or leaves). */
async function playThrough(page, dev, label, { maxMs = 90_000 } = {}) {
  const t0 = Date.now();
  let steps = 0;
  let audited = false;
  while (Date.now() - t0 < maxMs) {
    if (await isVisible(page.locator('.screen.results'))) return 'results';
    const back = page.locator('.screen.center-screen .btn-primary', { hasText: /Volver/ });
    if (await isVisible(back)) {
      await shot(page, dev, `locked-${slug(label)}`);
      await back.click();
      return 'locked';
    }
    if (!(await isVisible(page.locator('.app.immersive')))) return 'left';
    if (!audited && steps === 2) {
      await audit(page, dev, `game ${label}`);
      await shot(page, dev, `game-${slug(label)}`);
      audited = true;
    }
    const order = [
      '.verdict-actions .btn-primary',
      '.drill-intro .btn-primary',
      '.qf-btn.yes',
      '.grade.g2',
      '.grades .btn',
      '.reveal .btn-primary',
      '.reading:not([disabled])',
      '.opt:not([disabled])',
      '.reply:not([disabled])',
      '.piece:not([disabled])',
      '.fighter:not([disabled])',
      '.tones button:not([disabled])',
      '.screen.twist .btn-primary',
      '.screen.voice .btn-primary',
      '.stage-play',
    ];
    let clicked = false;
    for (const sel of order) {
      const loc = page.locator(sel);
      if (await isVisible(loc)) {
        if (sel === '.stage-play') {
          // Voice Acting: options unlock after listening.
          await loc.first().click();
          await page.waitForTimeout(1600);
        } else if (sel === '.verdict-actions .btn-primary') {
          await loc.first().click({ timeout: 4000 }).catch(() => {});
          await page.locator('.verdict').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
        } else {
          await loc.first().click({ timeout: 3000 }).catch(async (e) => {
            if (!process.env.DEBUG) return;
            const frames = await page.evaluate(async (sel) => {
              const out = [];
              for (let i = 0; i < 8; i++) {
                await new Promise((r) => requestAnimationFrame(r));
                const el = document.querySelector(sel);
                const r = el?.getBoundingClientRect();
                out.push(r ? `${r.x.toFixed(1)},${r.y.toFixed(1)},${r.width.toFixed(1)}x${r.height.toFixed(1)}` : 'none');
              }
              return out.join(' ');
            }, sel);
            console.log('click failed', sel, frames);
          });
        }
        clicked = true;
        break;
      }
    }
    if (!clicked) await page.waitForTimeout(250);
    steps++;
    await page.waitForTimeout(sel_delay(label));
  }
  fail(dev, `game ${label}: did not finish in ${maxMs / 1000}s`);
  await shot(page, dev, `stuck-${slug(label)}`);
  return 'timeout';
}
const sel_delay = (label) => (label === 'Quick Fire' ? 60 : 220);

async function closeSheets(page) {
  for (let i = 0; i < 3; i++) {
    const seguir = page.locator('.sheet .btn-primary', { hasText: /Seguir/ });
    if (await isVisible(seguir)) { await seguir.click(); await page.waitForTimeout(400); } else break;
  }
}

async function backFromResults(page) {
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(500);
    await closeSheets(page);
    const btn = page.locator('.screen.results .row-actions .btn').filter({ hasText: /Continuar|Volver/ }).first();
    if (await isVisible(btn)) await btn.click({ timeout: 3000 }).catch(() => {});
    if (await isVisible(page.locator('.nav'))) return;
  }
  throw new Error('could not leave the results screen');
}

async function runDevice(profile) {
  const dev = profile.name;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices[dev], serviceWorkers: 'allow' });
  await ctx.addInitScript(() => {
    window.__plays = { ok: 0, fail: 0 };
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const p = orig.call(this);
      p.then(() => {
        if (this.src && !this.src.startsWith('data:')) window.__plays.ok++;
      }).catch(() => window.__plays.fail++);
      return p;
    };
  });
  const page = await ctx.newPage();
  const errors = [];
  const played = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));

  try {
    await onboard(page);
    for (const [id, label] of TABS) {
      await go(page, label);
      await audit(page, dev, `tab ${id}`);
      await shot(page, dev, `tab-${id}`);
    }

    if (profile.full || profile.landscapeGame) {
      // Daily lesson from Today.
      await go(page, 'Hoy');
      const startLesson = page.locator('.screen.today .btn-primary').first();
      await startLesson.click();
      const r = await playThrough(page, dev, 'Lección del día');
      if (r === 'results') {
        await audit(page, dev, 'results');
        await shot(page, dev, 'results');
        await backFromResults(page);
      }
    }

    if (profile.full) {
      // Every game, each from a fresh profile so the 3-mistake rule of one game does not block the next.
      await go(page, 'Juegos');
      const games = [
        ...(await page.evaluate(() => [...document.querySelectorAll('.mode-list button b')].map((b) => b.textContent))).map((t, i) => [`.mode-list button >> nth=${i}`, t]),
        ['.feature >> nth=0', 'Quick Fire'],
        ['.feature >> nth=1', 'Memory'],
        ['.twist-card', 'The Unexpected Twist'],
        ['.voice-card', 'Voice Acting'],
      ];
      if (games.length < 11) fail(dev, `games tab lists ${games.length} games, expected 11`);
      for (const [sel, title] of games) {
        const gctx = await browser.newContext({ ...devices[dev] });
        const gp = await gctx.newPage();
        gp.on('pageerror', (e) => errors.push(`${title}: ${e.message}`));
        try {
          await onboard(gp);
          if (title === 'Memory') {
            // Memory reviews what you already know: play one lesson first.
            await gp.locator('.screen.today .btn-primary').first().click();
            if ((await playThrough(gp, dev, 'Lección (para Memory)')) === 'results') await backFromResults(gp);
          }
          await go(gp, 'Juegos');
          await gp.locator(sel).first().click();
          const r = await playThrough(gp, dev, title, { maxMs: title === 'Quick Fire' ? 90_000 : 150_000 });
          if (r === 'results') {
            await backFromResults(gp);
            played.push(title);
          } else if (r === 'locked') notes.push(`[${dev}] ${title}: hit the 3-mistake lock before the end (expected with random answers)`);
          else if (r === 'left') fail(dev, `${title}: left the game without a results screen`);
        } catch (e) {
          fail(dev, `${title}: ${e.message.split('\n')[0]}`);
          await shot(gp, dev, `crash-${slug(title)}`).catch(() => {});
        }
        await gctx.close();
      }
      notes.push(`[${dev}] games played to the results screen: ${played.length}/${games.length} (${played.join(', ')})`);

      // Translator.
      await go(page, 'Traductor');
      const box = page.locator('.screen.translate textarea').first();
      await box.fill('That is an interesting choice.');
      await page.locator('.screen.translate .btn-primary').first().click();
      await page.getByText(/Genial, justo lo que me hacía falta hoy|Mock OpenAI translation/).first().waitFor({ timeout: 10_000 }).catch(() => fail(dev, 'translator: no translation shown'));
      await audit(page, dev, 'translator result');
      await shot(page, dev, 'translator-result');

      // AI voice: tap a speaker in a collection.
      const before = await page.evaluate(() => window.__plays.ok);
      await go(page, 'Frases');
      const phrase = page.locator('.screen.phrases li button').first();
      if (await isVisible(phrase)) {
        await phrase.click();
        await page.waitForTimeout(500);
        await audit(page, dev, 'phrase sheet');
        await shot(page, dev, 'phrase-sheet');
      }
      const speak = page.locator('.sheet .speak').first();
      if (await isVisible(speak)) {
        await speak.click();
        await page.waitForTimeout(1500);
        const after = await page.evaluate(() => window.__plays.ok);
        if (after <= before) fail(dev, 'audio: tapping a speaker did not start playback');
      } else notes.push(`[${dev}] audio: no speaker button on Frases to test`);
      const totalPlays = await page.evaluate(() => window.__plays);
      if (totalPlays.ok === 0) fail(dev, 'audio: no AI voice clip was played during the whole run');
      if (totalPlays.fail) notes.push(`[${dev}] audio: ${totalPlays.fail} play() calls were rejected`);
    }

    // Progress persists across a reload.
    const xpBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('subtext-save-v1') || '{}')?.state?.xp ?? null);
    await page.reload({ waitUntil: 'load' });
    await page.locator('.nav').waitFor({ timeout: 10_000 }).catch(() => fail(dev, 'reload: app did not come back to the main screen (onboarding again?)'));
    const xpAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('subtext-save-v1') || '{}')?.state?.xp ?? null);
    if (xpBefore === null || xpAfter !== xpBefore) fail(dev, `persistence: xp before ${xpBefore}, after ${xpAfter}`);
    if ((profile.full || profile.landscapeGame) && !(xpAfter > 0)) fail(dev, 'persistence: playing earned no XP');

    // Backup: restore a save file from Profile.
    if (profile.full) {
      await go(page, 'Perfil');
      const raw = await page.evaluate(() => localStorage.getItem('subtext-save-v1'));
      const save = JSON.parse(raw);
      save.state.name = 'Restaurada';
      page.once('dialog', (d) => d.accept());
      await Promise.all([
        page.waitForEvent('load', { timeout: 10_000 }),
        page.locator('.backup input[type=file]').setInputFiles({ name: 'copia.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'SIDEYE', save })) }),
      ]).catch(() => fail(dev, 'backup: restoring did not reload the app'));
      await page.locator('.nav').waitFor({ timeout: 10_000 }).catch(() => {});
      const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('subtext-save-v1')).state.name);
      if (restored !== 'Restaurada') fail(dev, `backup: restored name is "${restored}"`);
    }

    // PWA: manifest, service worker, offline start.
    const man = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="manifest"]');
      if (!link) return null;
      return (await fetch(link.href)).json();
    });
    if (!man || man.display !== 'standalone' || !man.icons?.some((i) => i.sizes === '512x512')) fail(dev, 'pwa: manifest missing or incomplete');
    const sw = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
      return reg ? 'ready' : 'none';
    });
    if (sw !== 'ready') fail(dev, `pwa: service worker ${sw}`);
    else {
      await page.reload({ waitUntil: 'load' });
      await ctx.setOffline(true);
      await page.reload({ waitUntil: 'load' }).catch(() => {});
      const ok = await page.locator('.nav').waitFor({ timeout: 8000 }).then(() => true, () => false);
      if (!ok) fail(dev, 'pwa: app does not open offline');
      else await shot(page, dev, 'offline');
      await ctx.setOffline(false);
    }
    if (dev === 'Pixel 7') {
      const cdp = await ctx.newCDPSession(page);
      const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
      if (installabilityErrors.length) fail(dev, `pwa: Chrome says not installable: ${installabilityErrors.map((e) => e.errorId).join(', ')}`);
      else notes.push(`[${dev}] pwa: Chrome reports the app as installable`);
    }
  } catch (e) {
    fail(dev, `crashed: ${e.message.split('\n')[0]} at ${(e.stack.match(/mobile\.e2e\.mjs:(\d+)/) || [])[1]}`);
    await shot(page, dev, 'crash').catch(() => {});
  }
  for (const e of [...new Set(errors)]) fail(dev, `console/page error: ${e.slice(0, 200)}`);
  await browser.close();
}

for (const p of PROFILES.filter((p) => !only || only.includes(p.name))) {
  const t = Date.now();
  await runDevice(p);
  console.log(`done ${p.name} in ${Math.round((Date.now() - t) / 1000)}s`);
}
console.log('\nNotes:\n' + (notes.join('\n') || '(none)'));
console.log(`\nFailures (${failures.length}):\n` + (failures.join('\n') || '(none)'));
console.log(`\nScreenshots: ${OUT}`);
process.exit(failures.length ? 1 : 0);
