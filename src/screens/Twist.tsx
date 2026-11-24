import { LevelTag } from '../components/LevelTag';
import { XP_BY_TIER, tierOf } from '../data/levels';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../audio/sfx';
import { stop as stopVoice } from '../audio/voice';
import { Speak } from '../components/Speak';
import { Bar, Btn, Icon } from '../components/ui';
import { TWIST_COLLECTIONS, questionFor } from '../data/twists';
import { say } from '../data/voice';
import { dayKey } from '../engine/date';
import { gateWithChance } from '../engine/gate';
import { XP_COMBO_BONUS, difficulty } from '../engine/progression';
import { buildTwist } from '../engine/session';
import { useGame } from '../store/game';

const LETTERS = 'ABCD';

export function Twist() {
  const store = useGame();
  const run = store.run as { kind: 'twist'; collection?: (typeof TWIST_COLLECTIONS)[number]['id'] };
  const startGate = useMemo(() => gateWithChance(useGame.getState().reviewLock, dayKey(), useGame.getState().extraChance), []);
  const rounds = useMemo(() => {
    const st = useGame.getState();
    return buildTwist(st.extra, difficulty(st.recent), {
      allowNew: startGate.canLearnNew,
      priority: startGate.state === 'review-first' ? startGate.pending : [],
      collection: run.collection,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false); // the twist line is on screen
  const [picked, setPicked] = useState<number | null>(null); // original option index
  const [line, setLine] = useState('');
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const acc = useRef({ total: 0, firstTry: 0, maxCombo: 0, xp: 0, missed: [] as string[], mistakes: new Set<string>(), newIds: [] as string[], t0: Date.now() });
  const r = rounds[i];

  // Test hook (only with ?e2e in the URL).
  if (typeof window !== 'undefined' && window.location.search.includes('e2e')) (window as unknown as { __twist: unknown }).__twist = () => r && { id: r.scene.id, answer: r.scene.answer, order: r.order };

  // Reveal the dialogue line by line, then the twist after a beat.
  useEffect(() => {
    if (!r) return;
    setRevealed(false);
    setPicked(null);
    const t = setTimeout(() => setRevealed(true), 500 + r.scene.lines.length * 450);
    return () => clearTimeout(t);
  }, [r]);
  useEffect(() => () => stopVoice(), []);

  const finish = useCallback(() => {
    const a = acc.current;
    store.finishRun({
      run, total: a.total, firstTry: a.firstTry, maxCombo: a.maxCombo, xp: a.xp, newIds: [], missedIds: a.missed, mistakes: [...a.mistakes], gateAtStart: startGate.state, usedExtraChance: !!startGate.extra, ms: Date.now() - a.t0,
    });
  }, [store, run, startGate]);

  const pick = (opt: number) => {
    if (!r || picked !== null || !revealed) return;
    const ok = opt === r.scene.answer;
    const a = acc.current;
    a.total++;
    const next = ok ? combo + 1 : 0;
    setCombo(next);
    a.maxCombo = Math.max(a.maxCombo, next);
    store.answerExtra(r.scene.id, ok, { mode: 'twist', combo: next });
    if (ok) {
      a.firstTry++;
      a.xp += XP_BY_TIER[tierOf(r.scene)] + (next >= 3 ? XP_COMBO_BONUS : 0);
      next >= 3 && next % 3 === 0 ? sfx.streak() : sfx.correct();
      setLine(say(next >= 3 ? 'streak' : 'tone'));
    } else {
      sfx.wrong();
      a.missed.push(r.scene.id);
      a.mistakes.add(r.scene.id);
      setMisses(a.mistakes.size);
      setLine(say('wrongTone'));
    }
    setPicked(opt);
  };

  const nextRound = () => (i + 1 >= rounds.length ? finish() : setI(i + 1));

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!r) return;
      if (picked === null && revealed) {
        const n = Number(e.key);
        if (n >= 1 && n <= 4) pick(r.order[n - 1]);
      } else if (picked !== null && e.key === 'Enter') nextRound();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  if (!r)
    return (
      <div className="screen center-screen">
        <div className="eyebrow">↯ The Unexpected Twist</div>
        <p className="serif-lg">No scenes to replay yet.</p>
        <p className="muted">Hoy toca repasar lo que ya has visto y todavía no has jugado ninguna escena. El contenido nuevo vuelve {startGate.state === 'review-first' ? 'en cuanto termines el repaso' : 'mañana'}.</p>
        <Btn onClick={() => store.quit()}>Volver</Btn>
      </div>
    );

  const sc = r.scene;
  const col = TWIST_COLLECTIONS.find((c) => c.id === sc.col)!;
  const ok = picked === sc.answer;

  return (
    <div className="screen twist" style={{ ['--p1' as string]: col.colors[0], ['--p2' as string]: col.colors[1] }}>
      <header className="play-top">
        <button className="icon-btn" onClick={() => store.quit()} aria-label="Salir">
          <Icon name="x" size={18} />
        </button>
        <Bar value={i + (picked !== null ? 1 : 0)} max={rounds.length} className="play-bar" />
        {misses > 0 ? (
          <span className={`misses ${misses >= 3 ? 'over' : ''}`} title="Con 3 fallos, mañana toca repaso antes de contenido nuevo">
            {[0, 1, 2].map((k) => (
              <i key={k} className={k < misses ? 'on' : ''} />
            ))}
          </span>
        ) : (
          <span className="combo combo-empty">
            {i + 1}/{rounds.length}
          </span>
        )}
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={sc.id} className="twist-body" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className="twist-head">
            <div className="eyebrow">↯ The Unexpected Twist · {col.title}</div>
            <span className="stage-flags">
              {r.isReview && <span className="flag">Repaso</span>}
              <LevelTag item={sc} />
            </span>
          </div>

          <div className="script">
            <p className="slug">
              <span>Scene</span>
              {sc.setting}
            </p>
            {sc.lines.map(([who, text], k) => (
              <motion.div key={k} className="cue" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.45 }}>
                <span className="speaker">{who}</span>
                <p>{text}</p>
              </motion.div>
            ))}
            <AnimatePresence>
              {revealed && (
                <motion.div className="cue cue-twist" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}>
                  <span className="twist-tag">The twist</span>
                  <span className="speaker">{sc.twist[0]}</span>
                  <p>{sc.twist[1]}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {revealed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="twist-q">
              <p className="twist-question">{questionFor(sc)}</p>
              <div className="readings">
                {r.order.map((opt, k) => {
                  const state = picked === null ? '' : opt === sc.answer ? 'right' : opt === picked ? 'wrong' : 'dim';
                  return (
                    <button key={opt} className={`reading ${state}`} disabled={picked !== null} onClick={() => pick(opt)}>
                      <span className="reading-key">{LETTERS[k]}</span>
                      <span>{sc.options[opt]}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {picked !== null && (
            <motion.section className={`reveal ${ok ? 'ok' : 'ko'}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="reveal-top">
                <span className={`verdict-mark ${ok ? 'ok' : 'ko'}`}>
                  <Icon name={ok ? 'check' : 'x'} size={15} />
                </span>
                <p className="verdict-line">{line}</p>
              </div>
              {!ok && (
                <p className="verdict-answer">
                  <small>Lo que quiere decir</small> {sc.options[sc.answer]}
                </p>
              )}
              <div className="label">Entre líneas</div>
              <p className="reveal-explain">{sc.explain}</p>
              <div className="reveal-key">
                <span>“{sc.key}”</span>
                <Speak clips={[{ text: sc.key, tone: sc.tone }]} label={sc.key} />
              </div>
              <div className="label">Otro ejemplo</div>
              <div className="reveal-ex">
                <span className="ex-en">
                  {sc.ex[0]} <Speak clips={[{ text: sc.ex[0], tone: sc.tone }]} slowButton={false} size="sm" />
                </span>
                <span className="ex-es">{sc.ex[1]}</span>
              </div>
              <Btn wide onClick={nextRound}>
                {i + 1 >= rounds.length ? 'Ver resultado' : 'Siguiente escena'} <Icon name="arrow" size={16} />
              </Btn>
            </motion.section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
