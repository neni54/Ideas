import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../audio/sfx';
import { Highlight, SpeakBtn } from '../components/ExpressionCard';
import { Bar, Btn, Dots, Icon, Ring } from '../components/ui';
import { plain } from '../data/content';
import { difficulty } from '../engine/progression';
import { buildMemory, buildQuickFire } from '../engine/session';
import { playerLevel, useGame } from '../store/game';

/* ───────────── Quick Fire ───────────── */

export function QuickFire() {
  const store = useGame();
  const seconds = useMemo(() => (difficulty(useGame.getState().recent) === 0 ? 75 : 60), []);
  const items = useMemo(() => buildQuickFire(playerLevel(useGame.getState().xp)), []);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [time, setTime] = useState(seconds);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<null | boolean>(null);
  const acc = useRef({ answered: 0, maxCombo: 0, missed: [] as string[], t0: 0 });
  const item = items[i % items.length];
  const done = started && time <= 0;

  useEffect(() => {
    if (!started || done) return;
    const t = setTimeout(() => {
      setTime((x) => x - 1);
      if (time <= 6) sfx.tick();
    }, 1000);
    return () => clearTimeout(t);
  }, [started, time, done]);

  useEffect(() => {
    if (!done) return;
    const a = acc.current;
    store.finishRun({ run: { kind: 'quickfire' }, total: a.answered, firstTry: score, maxCombo: a.maxCombo, xp: 0, newIds: [], missedIds: [...new Set(a.missed)], score, ms: Date.now() - a.t0 });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = useCallback(
    (yes: boolean) => {
      if (!started || done) return;
      const ok = yes === item.truth;
      const a = acc.current;
      a.answered++;
      if (ok) {
        setScore((s) => s + 1);
        setCombo((c) => {
          a.maxCombo = Math.max(a.maxCombo, c + 1);
          return c + 1;
        });
        sfx.correct();
      } else {
        setCombo(0);
        a.missed.push(item.x.id);
        sfx.wrong();
      }
      setFlash(ok);
      setTimeout(() => setFlash(null), 260);
      setI((n) => n + 1);
    },
    [started, done, item],
  );

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') answer(false);
      if (e.key === 'ArrowRight') answer(true);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [answer]);

  if (!started)
    return (
      <div className="screen drill-intro">
        <button className="icon-btn" onClick={() => store.quit()} aria-label="Salir">
          <Icon name="x" size={18} />
        </button>
        <div className="eyebrow">⚡︎ Quick Fire</div>
        <h1 className="display">{seconds} seconds. Trust your gut.</h1>
        <p className="muted lead">Verás frases en inglés. Dos tipos de pregunta: si suena nativo y si significa lo que dice la tarjeta. Responde sí o no, lo más rápido posible.</p>
        <ul className="rules">
          <li>
            <kbd>←</kbd> No · <kbd>→</kbd> Sí en teclado
          </li>
          <li>Récord actual: {store.stats.qfBest}</li>
        </ul>
        <Btn
          wide
          onClick={() => {
            acc.current.t0 = Date.now();
            setStarted(true);
          }}
        >
          Empezar
        </Btn>
      </div>
    );

  return (
    <div className={`screen qf ${flash === true ? 'flash-ok' : flash === false ? 'flash-ko' : ''}`}>
      <header className="qf-top">
        <Ring value={time / seconds} size={56} stroke={3} tone={time <= 10 ? 'accent' : 'cream'}>
          <b className="mono">{Math.max(0, time)}</b>
        </Ring>
        <div className="qf-score">
          <b className="mono">{score}</b>
          <small>{combo >= 3 ? `racha ×${combo}` : 'aciertos'}</small>
        </div>
      </header>
      <AnimatePresence mode="wait">
        <motion.div key={item.id + i} className="qf-card" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.1 }}>
          <div className="eyebrow">{item.kind === 'natural' ? '¿Suena nativo?' : '¿Significa esto?'}</div>
          <p className="qf-line">“{item.line}”</p>
          {item.claim && (
            <p className="qf-claim">
              <span>=</span> {item.claim}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="qf-actions">
        <button className="qf-btn no" onClick={() => answer(false)}>
          <Icon name="x" size={22} /> No
        </button>
        <button className="qf-btn yes" onClick={() => answer(true)}>
          <Icon name="check" size={22} /> Sí
        </button>
      </div>
    </div>
  );
}

/* ───────────── Memory ───────────── */

export function Memory() {
  const store = useGame();
  const deck = useMemo(() => buildMemory(useGame.getState().cards), []);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const acc = useRef({ knew: 0, xp: 0, missed: [] as string[], t0: Date.now() });
  const x = deck[i];

  const rate = (g: 0 | 1 | 2) => {
    store.grade(x.id, g);
    const a = acc.current;
    a.xp += 2 + (g === 2 ? 3 : g === 1 ? 1 : 0);
    if (g === 2) a.knew++;
    if (g === 0) a.missed.push(x.id);
    g === 2 ? sfx.correct() : sfx.flip();
    if (i + 1 >= deck.length) {
      store.finishRun({ run: { kind: 'memory' }, total: deck.length, firstTry: a.knew, maxCombo: 0, xp: a.xp, newIds: [], missedIds: a.missed, ms: Date.now() - a.t0 });
    } else {
      setFlipped(false);
      setI(i + 1);
    }
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!x) return;
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setFlipped(true);
        sfx.flip();
      } else if (flipped && ['1', '2', '3'].includes(e.key)) rate((Number(e.key) - 1) as 0 | 1 | 2);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  if (!x)
    return (
      <div className="screen center-screen">
        <div className="eyebrow">◐ Memory</div>
        <p className="serif-lg">Your memory is suspiciously empty.</p>
        <p className="muted">Juega una sesión para empezar tu colección. Lo que aprendas volverá aquí justo antes de que se te olvide.</p>
        <Btn onClick={() => store.quit()}>Volver</Btn>
      </div>
    );

  const card = store.cards[x.id];
  return (
    <div className="screen memory">
      <header className="play-top">
        <button className="icon-btn" onClick={() => store.quit()} aria-label="Salir">
          <Icon name="x" size={18} />
        </button>
        <Bar value={i} max={deck.length} className="play-bar" />
        <span className="combo combo-empty">
          {i + 1}/{deck.length}
        </span>
      </header>
      <div className="eyebrow">◐ Memory · repaso espaciado</div>
      <div className={`flip ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-inner">
          <button
            className="face front"
            onClick={() => {
              setFlipped(true);
              sfx.flip();
            }}
            aria-label="Mostrar respuesta"
          >
            <div className="face-meta">
              <span className={`lvl lvl-${x.level}`}>{x.level}</span>
              {card && <Dots value={card.box} />}
            </div>
            <p className="face-en">
              <Highlight en={x.en} />
            </p>
            <p className="face-hint">¿Qué significa y cuándo lo usarías? Piénsalo, luego toca para girar.</p>
          </button>
          <div className="face back">
            <div className="face-meta">
              <span className={`lvl lvl-${x.level}`}>{x.level}</span>
              <SpeakBtn text={plain(x.en)} />
            </div>
            <p className="face-es">{x.es}</p>
            <p className="face-gist">{x.gist}</p>
            <p className="face-ex">
              {x.ex[0]}
              <span>{x.ex[1]}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="grades">
        {flipped ? (
          <>
            <button className="grade g0" onClick={() => rate(0)}>
              Ni idea<small>vuelve en 10 min</small>
            </button>
            <button className="grade g1" onClick={() => rate(1)}>
              Me costó<small>mañana</small>
            </button>
            <button className="grade g2" onClick={() => rate(2)}>
              Lo sabía<small>más adelante</small>
            </button>
          </>
        ) : (
          <Btn
            wide
            onClick={() => {
              setFlipped(true);
              sfx.flip();
            }}
          >
            Mostrar
          </Btn>
        )}
      </div>
    </div>
  );
}
