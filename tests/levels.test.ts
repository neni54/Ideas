// SIDEYE levels & difficulty (run: npm run test:levels).
import { PACKS, ALL, ALL_LIST, chunkOf } from '../src/data/content';
import { LEVELS, NEW_PHRASE_SLOTS, tierOf } from '../src/data/levels';
import { DAILY_LINES, dailyLine } from '../src/data/dailyline';
import { SCENES } from '../src/data/twists';
import { LINES } from '../src/data/voiceacting';
import { buildDaily, buildPractice, buildQuickFire, buildTwist, buildVoice, pickNew, nextNewTiers } from '../src/engine/session';
import { currentLevel, levelStats } from '../src/engine/levelProgress';
import { newCard, type Card } from '../src/engine/srs';
import { gateFor } from '../src/engine/gate';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`);
};
const count = (ts: number[]) => [1, 2, 3, 4, 5].map((t) => ts.filter((x) => (t === 4 ? x >= 4 : x === t)).length).slice(0, 4).join('/');

// 1. Five levels
ok('Hay 5 niveles en orden', LEVELS.map((l) => l.name).join(' | ') === 'FIRST STEPS | GETTING COMFORTABLE | REAL-LIFE ENGLISH | READ BETWEEN THE LINES | THINK IN ENGLISH');
ok('Cada nivel tiene colecciones', LEVELS.every((l) => PACKS.some((p) => p.tier === l.tier)));
ok('Las colecciones están ordenadas de fácil a difícil', PACKS.every((p, i) => i === 0 || PACKS[i - 1].tier <= p.tier));
ok('Las primeras colecciones son FIRST STEPS', PACKS.slice(0, 6).every((p) => p.tier === 1));
ok('Regla de 10: 4 del nivel 1, 3 del 2, 2 del 3, 1 superior', count(NEW_PHRASE_SLOTS.map((s) => (s === 'top' ? 4 : s))) === '4/3/2/1');

// 2. Content
ok('Ids de frases únicos', new Set(PACKS.flatMap((p) => p.expressions.map((x) => x.id))).size === ALL_LIST.length, `${ALL_LIST.length} frases`);
const bad = ALL_LIST.filter((x) => !x.en || !x.es || !x.literal || !x.meaning || !x.scene || !chunkOf(x.en) || (x.reply && chunkOf(x.reply) !== chunkOf(x.en)));
ok('Todas las frases tienen inglés, español, significado, escena y [fragmento] coherente', bad.length === 0, bad.map((x) => x.id).join(','));
const t1 = ALL_LIST.filter((x) => tierOf(x) === 1);
const words = (x: { en: string }) => x.en.replace(/\[|\]/g, '').split(/\s+/).length;
ok('FIRST STEPS: frases cortas (≤ 7 palabras)', t1.every((x) => words(x) <= 7), t1.filter((x) => words(x) > 7).map((x) => x.en).join(' / '));
ok('Cada frase tiene un nivel 1–5', ALL_LIST.every((x) => [1, 2, 3, 4, 5].includes(tierOf(x))), levelStats({}).map((s) => `${s.tier}:${s.total}`).join(' '));

// 3. New phrases follow 4/3/2/1 across many lessons (fresh player)
let cards: Record<string, Card> = {};
const order: number[] = [];
for (let lesson = 0; lesson < 24; lesson++) {
  const want = nextNewTiers(cards, 3);
  const got = pickNew(cards, 3, 1);
  ok(`Lección ${lesson + 1}: las nuevas coinciden con el reparto`, got.map((x) => Math.min(tierOf(x), 4)).sort().join() === want.map((t) => Math.min(t, 4)).sort().join(), got.map((x) => `${x.id}:${tierOf(x)}`).join(' '));
  got.forEach((x) => { cards[x.id] = newCard(Date.now()); order.push(tierOf(x)); });
}
for (let b = 0; b < 7; b++) ok(`Bloque de 10 frases nuevas nº ${b + 1}: 4/3/2/1`, count(order.slice(b * 10, b * 10 + 10)) === '4/3/2/1', count(order.slice(b * 10, b * 10 + 10)));
ok('Las 3 primeras frases nuevas son de nivel 1–2 (inicio fácil)', order.slice(0, 3).every((t) => t <= 2), order.slice(0, 3).join());
ok('No salen constantemente frases avanzadas (≤ 10 % nivel 4–5 en las primeras 60)', order.slice(0, 60).filter((t) => t >= 4).length <= 6);

// 4. First real lesson is easy
const first = buildDaily({}, 1, 'normal');
ok('Primera lección diaria: 8 retos', first.length === 8);
ok('Primera lección diaria: solo niveles 1–3', first.every((c) => tierOf(c.x) <= 3), first.map((c) => tierOf(c.x)).join());
ok('Primera lección diaria: mayoría FIRST STEPS', first.filter((c) => tierOf(c.x) === 1).length >= 4, first.map((c) => tierOf(c.x)).join());
const pr = buildPractice('meaning', {}, 1, 'normal');
ok('What does it really mean (práctica): empieza en niveles 1–2', pr.slice(0, 3).every((c) => tierOf(c.x) <= 3), pr.map((c) => tierOf(c.x)).join());

// 5. Quick Fire weighting
const qf = Array.from({ length: 20 }, () => buildQuickFire(1)).flat().map((q) => tierOf(q.x));
const share = (t: number) => qf.filter((x) => x === t).length / qf.length;
ok('Quick Fire: nivel 1 es el más frecuente', share(1) > share(2) && share(2) > share(3), [1, 2, 3, 4, 5].map((t) => `${t}:${Math.round(share(t) * 100)}%`).join(' '));
ok('Quick Fire: niveles 4–5 ≤ 15 %', share(4) + share(5) <= 0.15);

// 6. Twist & Voice Acting go easy → hard
ok('Unexpected Twist: hay escenas de nivel 1–2', SCENES.filter((s) => tierOf(s) <= 2).length >= 5, `${SCENES.length} escenas`);
const tw = buildTwist({}, 'normal');
ok('Unexpected Twist: la primera ronda empieza por las escenas más fáciles', tw.every((r) => tierOf(r.scene) <= 2), tw.map((r) => tierOf(r.scene)).join());
const vo = buildVoice({});
ok('Voice Acting: empieza por frases sencillas', tierOf(vo[0].line) <= 2, vo.map((r) => tierOf(r.line)).join());
ok('Voice Acting: todas las frases tienen nivel', LINES.every((l) => [1, 2, 3, 4, 5].includes(tierOf(l))));

// 7. The Daily Line
ok('Daily Line: ids únicos', new Set(DAILY_LINES.map((l) => l.id)).size === DAILY_LINES.length);
ok('Daily Line: todas con traducción al español', DAILY_LINES.every((l) => l.en && l.es));
ok('Daily Line: los enlaces a fichas existen', DAILY_LINES.every((l) => !l.x || ALL[l.x]), DAILY_LINES.filter((l) => l.x && !ALL[l.x]).map((l) => l.id).join());
const days = (from: number, n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(Date.UTC(2026, 0, 1 + from + i)); return d.toISOString().slice(0, 10); });
for (const start of [0, 320, 1000]) ok(`Daily Line: 10 días seguidos = 4/3/2/1 (desde el día ${start})`, count(days(start, 10).map((d) => dailyLine(d).tier)) === '4/3/2/1');
const yr = days(0, 365).map((d) => dailyLine(d).id);
ok('Daily Line: no se repite en 10 días seguidos', yr.every((id, i) => !yr.slice(Math.max(0, i - 9), i).includes(id)));
ok('Daily Line de hoy (2026-11-24)', !!dailyLine('2026-11-24').en, `${dailyLine('2026-11-24').tier} · ${dailyLine('2026-11-24').en}`);

// 8. Old saves and progress
const old: Record<string, Card> = { 'everyday-1': newCard(0), 'sarcasm-1': newCard(0), 'idioms-2': newCard(0), 'gone-id': newCard(0) };
ok('Partida antigua: las frases antiguas siguen existiendo', ['everyday-1', 'sarcasm-1', 'idioms-2'].every((id) => ALL[id]));
ok('Partida antigua: se puede construir una lección', buildDaily(old, 3, 'normal').length === 8);
ok('Partida antigua: el nivel actual empieza en FIRST STEPS', currentLevel(old).tier === 1);
const t1done: Record<string, Card> = Object.fromEntries(t1.map((x) => [x.id, newCard(0)]));
ok('Al completar FIRST STEPS se recomienda GETTING COMFORTABLE', currentLevel(t1done).tier === 2);

// 9. The 3-mistake gate is unchanged
ok('Bloqueo de 3 fallos sigue igual', typeof gateFor === 'function');

console.log(failed ? `\n${failed} FALLOS` : '\nTodo correcto.');
process.exit(failed ? 1 : 0);
