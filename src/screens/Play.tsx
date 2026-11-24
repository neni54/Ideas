import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { play as playVoice, stop as stopVoice } from '../audio/voice';
import { sfx } from '../audio/sfx';
import { Highlight } from '../components/ExpressionCard';
import { Speak, toneFor } from '../components/Speak';
import { Bar, Btn, Icon, Sheet } from '../components/ui';
import { PACK_BY_ID, plain } from '../data/content';
import { INTENT_LABEL, MODE_BY_ID } from '../data/meta';
import { say } from '../data/voice';
import { retryOf, type Challenge, type Option } from '../engine/challenges';
import { shuffle } from '../engine/date';
import { XP_BY_LEVEL, XP_COMBO_BONUS, XP_RETRY, difficulty } from '../engine/progression';
import { buildDaily, buildEpisode, buildPractice } from '../engine/session';
import { ModeView } from '../modes/Modes';
import { playerLevel, useGame, type Run } from '../store/game';
import { dayKey } from '../engine/date';
import { gateWithChance } from '../engine/gate';

function buildQueue(run: Run, s: ReturnType<typeof useGame.getState>, diff: 0 | 1 | 2): Challenge[] {
  const level = playerLevel(s.xp);
  const gate = gateWithChance(s.reviewLock, dayKey(), s.extraChance);
  const opts = { allowNew: gate.canLearnNew, priority: gate.state === 'review-first' ? gate.pending : [] };
  if (run.kind === 'episode') return buildEpisode(run.packId, s.cards, diff, Date.now(), opts);
  if (run.kind === 'daily') return buildDaily(s.cards, level, diff, Date.now(), opts);
  if (run.kind === 'practice') return buildPractice(run.mode, s.cards, level, diff, run.packId, opts);
  return [];
}

export function runLabel(run: Run) {
  if (run.kind === 'episode') return PACK_BY_ID[run.packId].title;
  if (run.kind === 'daily') return 'Lección';
  if (run.kind === 'practice') return MODE_BY_ID[run.mode].title;
  return MODE_BY_ID[run.kind].title;
}

function teaching(c: Challenge, picked: Option) {
  const x = c.x;
  if (c.mode === 'battle') return x.battle[2];
  if (c.mode === 'sarcasm') return `Tono: ${INTENT_LABEL[x.intent].toLowerCase()}. ${x.meaning}`;
  if (c.mode === 'natural' && picked.kind !== 'right') return `Lo natural: “${plain(x.en)}”. Lo otro es español traducido palabra por palabra.`;
  if (c.mode === 'reply' && picked.kind !== 'right') return `Respuesta natural: “${plain(x.en)}”. ${x.meaning}`;
  return x.meaning;
}

export function Play() {
  const store = useGame();
  const run = store.run!;
  const diff = useMemo(() => difficulty(useGame.getState().recent), []);
  const [queue, setQueue] = useState<Challenge[]>(() => buildQueue(run, useGame.getState(), diff));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Option | null>(null);
  const [line, setLine] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [combo, setCombo] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [quitting, setQuitting] = useState(false);
  const acc = useRef({ total: 0, firstTry: 0, maxCombo: 0, xp: 0, newIds: [] as string[], missed: [] as string[], retried: new Set<string>(), mistakes: new Set<string>(), gateAtStart: gateWithChance(useGame.getState().reviewLock, dayKey(), useGame.getState().extraChance).state, extraAtStart: !!gateWithChance(useGame.getState().reviewLock, dayKey(), useGame.getState().extraChance).extra, t0: Date.now() });
  const c = queue[idx];

  // Test hook for automated play-throughs (only with ?e2e in the URL).
  if (typeof window !== 'undefined' && window.location.search.includes('e2e')) {
    (window as unknown as { __c: () => Challenge | undefined }).__c = () => c;
  }

  useEffect(() => {
    setPicked(null);
    setHidden(new Set());
  }, [c?.uid]);
  useEffect(() => () => stopVoice(), []);

  const finish = useCallback(() => {
    const a = acc.current;
    store.finishRun({ run, total: a.total, firstTry: a.firstTry, maxCombo: a.maxCombo, xp: a.xp, newIds: a.newIds, missedIds: [...new Set(a.missed)], mistakes: [...a.mistakes], gateAtStart: a.gateAtStart, ms: Date.now() - a.t0, ids: [...new Set(queue.map((q) => q.x.id))], usedExtraChance: a.extraAtStart });
  }, [store, run, queue]);

  const pick = useCallback(
    (o: Option) => {
      if (!c || picked) return;
      const ok = o.kind === 'right';
      const a = acc.current;
      if (!c.isRetry) a.total++;
      const nextCombo = ok ? combo + 1 : 0;
      setCombo(nextCombo);
      a.maxCombo = Math.max(a.maxCombo, nextCombo);
      const { isNew: fresh } = store.answer(c.x.id, ok, { mode: c.mode, isRetry: c.isRetry, combo: nextCombo });
      if (fresh) a.newIds.push(c.x.id);
      setIsNew(fresh);
      if (ok) {
        if (!c.isRetry) a.firstTry++;
        a.xp += c.isRetry ? XP_RETRY : XP_BY_LEVEL[c.x.level] + (nextCombo >= 3 ? XP_COMBO_BONUS : 0);
        nextCombo >= 3 && nextCombo % 3 === 0 ? sfx.streak() : sfx.correct();
        setLine(say(c.isRetry ? 'retry' : nextCombo >= 3 ? 'streak' : c.mode === 'sarcasm' ? 'tone' : c.mode === 'natural' ? 'natural' : 'correct'));
      } else {
        sfx.wrong();
        a.missed.push(c.x.id);
        // One mistake per expression per session; second chances never add to the count.
        if (!c.isRetry) a.mistakes.add(c.x.id);
        setMissCount(a.mistakes.size);
        setLine(say(o.kind === 'literal' ? 'literal' : o.kind === 'calque' ? 'calque' : c.mode === 'sarcasm' ? 'wrongTone' : 'wrong'));
        if (!a.retried.has(c.x.id)) {
          a.retried.add(c.x.id);
          setQueue((q) => [...q, retryOf(c, diff)]);
        }
      }
      setPicked(o);
      if (useGame.getState().settings.voice) playVoice([{ text: plain(c.x.en), tone: toneFor(c.x) }]);
    },
    [c, picked, combo, store, diff],
  );

  const next = useCallback(() => {
    if (!picked) return;
    if (idx + 1 >= queue.length) finish();
    else setIdx(idx + 1);
  }, [picked, idx, queue.length, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (quitting || store.openX) return;
      if (e.key === 'Enter' && picked) next();
      const n = Number(e.key);
      if (!picked && c && n >= 1 && n <= c.options.length && !hidden.has(c.options[n - 1].value)) pick(c.options[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picked, next, pick, c, hidden, quitting, store.openX]);

  if (!c) {
    return (
      <div className="screen center-screen">
        <p className="serif-lg">Nothing to play here yet.</p>
        <p className="muted">
          {gateWithChance(store.reviewLock, dayKey(), store.extraChance).canLearnNew
            ? 'Desbloquea más colecciones subiendo de nivel.'
            : 'Hoy solo se repasa lo que ya has visto, y aquí todavía no hay nada visto. Prueba la siguiente lección o Memory.'}
        </p>
        <Btn onClick={() => store.quit()}>Volver</Btn>
      </div>
    );
  }

  const info = MODE_BY_ID[c.mode];
  const canHint = c.mode !== 'battle' && c.options.length >= 3 && !picked && hidden.size === 0;
  const useHint = () => {
    if (!canHint || !store.useHint()) return;
    const wrong = c.options.filter((o) => o.kind !== 'right').map((o) => o.value);
    setHidden(new Set(shuffle(wrong).slice(0, Math.max(1, Math.floor(wrong.length / 2)))));
    sfx.flip();
  };
  const ok = picked?.kind === 'right';
  const rightOpt = c.options.find((o) => o.kind === 'right')!;

  return (
    <div className="screen play">
      <header className="play-top">
        <button className="icon-btn" onClick={() => setQuitting(true)} aria-label="Salir">
          <Icon name="x" size={18} />
        </button>
        <Bar value={idx + (picked ? 1 : 0)} max={queue.length} className="play-bar" />
        {missCount > 0 && (
          <span className={`misses ${missCount >= 3 ? 'over' : ''}`} title="Con 3 fallos en una lección, mañana toca repaso antes de contenido nuevo">
            {[0, 1, 2].map((i) => (
              <i key={i} className={i < missCount ? 'on' : ''} />
            ))}
          </span>
        )}
        <AnimatePresence mode="popLayout">
          {combo >= 2 ? (
            <motion.span key={combo} className="combo" initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
              <Icon name="flame" size={14} />×{combo}
            </motion.span>
          ) : (
            <span className="combo combo-empty">{idx + 1}/{queue.length}</span>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence mode="wait">
        <motion.main key={c.uid} className="stage" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <div className="stage-head">
            <div>
              <div className="eyebrow">
                {info.glyph} · {info.title}
              </div>
              <div className="stage-flags">
                {c.isReview && <span className="flag">Repaso</span>}
                {c.isRetry && <span className="flag">Segunda oportunidad</span>}
                {c.isSurprise && <span className="flag flag-accent">Sorpresa · {PACK_BY_ID[c.x.pack].title}</span>}
                <span className={`lvl lvl-${c.x.level}`}>{c.x.level}</span>
              </div>
            </div>
            {canHint && (
              <button className="hint" onClick={useHint} disabled={store.hints <= 0} title="Elimina opciones incorrectas">
                50/50 <span>{store.hints}</span>
              </button>
            )}
          </div>
          <ModeView c={c} picked={picked} hidden={hidden} onPick={pick} />
        </motion.main>
      </AnimatePresence>

      <AnimatePresence>
        {picked && (
          <motion.section className={`verdict ${ok ? 'v-ok' : 'v-ko'}`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
            <div className="verdict-top">
              <span className={`verdict-mark ${ok ? 'ok' : 'ko'}`}>
                <Icon name={ok ? 'check' : 'x'} size={16} />
              </span>
              <p className="verdict-line">{line}</p>
              {isNew && <span className="flag flag-accent">Phrase unlocked</span>}
            </div>
            {!ok && c.mode !== 'complete' && (
              <p className="verdict-answer">
                <small>La buena</small> {rightOpt.text}
              </p>
            )}
            <div className="verdict-x">
              <div className="verdict-en">
                <span>
                  <Highlight en={c.x.en} />
                </span>
                <Speak clips={[{ text: plain(c.x.en), tone: toneFor(c.x) }]} size="sm" />
              </div>
              <p className="verdict-es">{c.x.es}</p>
            </div>
            <p className="verdict-teach">{teaching(c, picked)}</p>
            {!ok && (
              <p className="verdict-mistake">
                <b>Error típico ·</b> {c.x.mistake}
              </p>
            )}
            <div className="verdict-actions">
              <Btn variant="ghost" onClick={() => store.openExpression(c.x.id)}>
                Ver ficha
              </Btn>
              <Btn onClick={next}>{idx + 1 >= queue.length ? 'Ver resultado' : 'Continuar'}</Btn>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <Sheet open={quitting} onClose={() => setQuitting(false)}>
        <p className="serif-lg">Leaving so soon?</p>
        <p className="muted">Lo que ya has respondido cuenta para tu colección y tus repasos. La sesión no suma XP de bonus.</p>
        <div className="row-actions">
          <Btn variant="ghost" onClick={() => store.quit()}>
            Salir
          </Btn>
          <Btn onClick={() => setQuitting(false)}>Seguir</Btn>
        </div>
      </Sheet>
    </div>
  );
}
