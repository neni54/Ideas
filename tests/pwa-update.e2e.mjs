// PWA update flow: open version A, deploy version B, check the "Nueva versión" banner,
// tap "Actualizar", and confirm the new version runs with the progress intact.
// Run through tests/run-pwa-update-test.sh (it rebuilds the app in the middle).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE;
const fails = [];
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const p = await ctx.newPage();
await p.goto(BASE);
await p.getByRole('button', { name: /Empezar/ }).click();
await p.getByRole('button', { name: /Saltar/ }).click();
await p.fill('#ob-name', 'Update');
await p.getByRole('button', { name: /Entrar/ }).click();
await p.evaluate(() => navigator.serviceWorker.ready);
await p.reload();
await p.locator('.nav').waitFor();
const swA = await p.evaluate(async () => (await fetch('/sw.js')).text().then((t) => t.match(/VERSION = '([^']+)'/)[1]));
const saveA = await p.evaluate(() => localStorage.getItem('subtext-save-v1'));

execSync('npm run build', { stdio: 'ignore' }); // "deploy" version B
await p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
const banner = p.locator('.update-banner');
if (!(await banner.waitFor({ timeout: 15000 }).then(() => true, () => false))) fails.push('update banner did not appear');
else {
  await p.screenshot({ path: `${process.env.OUT || '.'}/update-banner.png` });
  await Promise.all([p.waitForEvent('load', { timeout: 15000 }), banner.getByRole('button', { name: 'Actualizar' }).click()]);
  await p.locator('.nav').waitFor();
  const active = await p.evaluate(() => new Promise((r) => {
    const sw = navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('message', (e) => r(e.data.version), { once: true });
    sw.postMessage('VERSION');
  }));
  if (active === swA) fails.push(`still on the old version ${swA}`);
  const name = await p.evaluate(() => JSON.parse(localStorage.getItem('subtext-save-v1')).state.name);
  if (name !== 'Update' || !saveA) fails.push('progress lost after the update');
  console.log(`updated ${swA} -> ${active}; player "${name}" kept`);
}
await b.close();
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS pwa update flow');
process.exit(fails.length ? 1 : 0);
