// Unit tests for the progression gate. Run: npm run test:gate (several time zones).
import { MISTAKE_LIMIT, afterReview, afterSession, gateFor, nextLocalMidnight, settle, statusOf } from '../src/engine/gate';
import { dayKey } from '../src/engine/date';

let pass = 0;
let fail = 0;
const ok = (name: string, cond: boolean, info = '') => {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  [${process.env.TZ}] ${name}${info ? '  — ' + info : ''}`);
};

const MON = '2026-11-23';
const TUE = '2026-11-24';

// 1-3: zero, one, two mistakes never lock (and duplicates count once)
for (const missed of [[], ['a'], ['a', 'b'], ['a', 'a', 'b', 'b']]) {
  const lock = afterSession(null, MON, missed);
  ok(`${new Set(missed).size} distinct mistake(s) → can keep learning`, gateFor(lock, MON).canLearnNew);
}
ok('limit is three', MISTAKE_LIMIT === 3);

// 4: three mistakes lock new content for the rest of the local day
let lock = afterSession(null, MON, ['a', 'b', 'c']);
ok('3 mistakes → locked today', gateFor(lock, MON).state === 'locked-today' && !gateFor(lock, MON).canLearnNew);
ok('reviewing on the same day does not clear the debt', afterReview(lock, MON, 'a')!.pending.length === 3);
ok('reloading (same persisted lock, same day) stays locked', gateFor(JSON.parse(JSON.stringify(lock)), MON).state === 'locked-today');
const lock2 = afterSession(lock, MON, ['c', 'd', 'e']);
ok('another bad session the same day merges, no double counting', lock2!.pending.length === 5 && lock2!.day === MON);

// 6: next day → review first, then free
ok('next day → review first', gateFor(lock, TUE).state === 'review-first');
lock = afterReview(lock, TUE, 'a');
lock = afterReview(lock, TUE, 'b');
ok('partial review keeps new content paused', gateFor(lock, TUE).state === 'review-first' && lock!.pending.join() === 'c');
lock = afterReview(lock, TUE, 'c');
ok('all reviewed → lock cleared, new content open', lock === null && gateFor(lock, TUE).canLearnNew);
ok('a good session on Tuesday keeps learning open', gateFor(afterSession(null, TUE, ['x', 'y']), TUE).canLearnNew);
let l3 = afterSession(null, MON, ['a', 'b', 'c']);
l3 = afterSession(l3, TUE, ['d', 'e', 'f']);
ok('3 mistakes again on Tuesday → locked Tuesday, Monday debt kept', gateFor(l3, TUE).state === 'locked-today' && l3!.pending.length === 6);
ok('settle keeps a lock with debt', settle(afterSession(null, MON, ['a', 'b', 'c']), TUE) !== null);
ok('settle drops an empty past lock', settle({ day: MON, ids: ['a'], pending: [], mistakes: 3 }, TUE) === null);
ok('clock going backwards never unlocks early', gateFor(afterSession(null, TUE, ['a', 'b', 'c']), MON).state === 'locked-today');

// 8: local midnight
const late = new Date(2026, 10, 23, 23, 59, 59);
const early = new Date(2026, 10, 24, 0, 0, 1);
ok('23:59:59 local is still Monday', dayKey(late) === MON);
ok('00:00:01 local is Tuesday', dayKey(early) === TUE);
const mid = new Date(nextLocalMidnight(late));
ok('next local midnight is 00:00 of Tuesday', mid.getHours() === 0 && mid.getMinutes() === 0 && dayKey(mid) === TUE, mid.toString());
// DST change days (Europe: 2026-03-29, US: 2026-11-01): midnight is still the start of the next local day
for (const [y, m, d] of [[2026, 2, 28], [2026, 9, 31], [2026, 9, 24]]) {
  const n = new Date(nextLocalMidnight(new Date(y, m, d, 22, 30)));
  ok(`midnight after ${y}-${m + 1}-${d} (DST-sensitive)`, n.getHours() === 0 && n.getDate() === new Date(y, m, d + 1).getDate(), n.toString());
}

// statuses
const now = Date.now();
ok('status new', statusOf(undefined, now) === 'new');
ok('status review (missed)', statusOf({ box: 0, due: now + 1e6, seen: 1, right: 0, wrong: 1, first: now }, now) === 'review');
ok('status learning', statusOf({ box: 2, due: now + 1e6, seen: 3, right: 3, wrong: 0, first: now }, now) === 'learning');
ok('status mastered', statusOf({ box: 5, due: now + 1e9, seen: 9, right: 9, wrong: 0, first: now }, now) === 'mastered');

console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
