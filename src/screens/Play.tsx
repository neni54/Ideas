import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HeartIcon, Npc, Pip } from '../art/Art';
import { sfx } from '../audio/sfx';
import { speak } from '../audio/speech';
import { Bar, Btn, Burst, Modal } from '../components/ui';
import { PETS } from '../data/meta';
import { WORLD1 } from '../data/world1';
import { ExerciseView, SpeakBtn } from '../exercises/Exercises';
import { plain, sameAnswer, type Exercise } from '../engine/exercises';
import { COINS_CORRECT, XP_COMBO_BONUS, XP_CORRECT, difficulty as diffOf } from '../engine/progression';
import { buildEchoSession, buildLevelSession, retryOf } from '../engine/session';
import { shuffle } from '../engine/date';
import { useGame } from '../store/game';

const PRAISE = ['¡Brillante!', '¡Perfecto!', '¡Así se hace!', '¡Luz pura!', '¡Genial!', '¡Exacto!'];
const COMBO_PRAISE = ['¡Racha de luz!', '¡Imparable!', '¡En llamas!'];
const SOFT_MISS = ['¡Casi!', 'Uy, por poco', 'Buen intento', 'Lo tienes cerca'];
const HEARTS = 5;
const MAX_RETRIES = 2;

const timeFor = (ex: Exercise, diff: number, bonus: number) =>
  (ex.type === 'build' ? 22 : ex.type === 'fill' ? 14 : 13) + (diff === 0 ? 6 : diff === 2 ? -3 : 0) + bonus;

export function Play() {
  const store = useGame();
  const target = store.target!;
  const level = target.mode === 'level' ? WORLD1.levels.find((l) => l.id === target.levelId)! : null;
  const isBoss = level?.kind === 'boss';
  const isTimed = level?.kind === 'timed';
  const isChest = level?.kind === 'chest';
  const diff = useMemo(() => diffOf(store.recent), []); // eslint-disable-line react-hooks/exhaustive-deps
  const petPerk = PETS.find((p) => p.id === store.pet)?.perk;
  const timeBonus = petPerk === 'time' ? 5 : 0;

  const [queue, setQueue] = useState<Exercise[]>(() =>
    level ? buildLevelSession(level, store.srs, diff) : buildEchoSession(store.srs),
  );
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<null | boolean>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [combo, setCombo] = useState(0);
  const [praise, setPraise] = useState('');
  const [quit, setQuit] = useState(false);
  const [intro, setIntro] = useState(!!level && (isBoss || isChest || isTimed));
  const [hit, setHit] = useState(0);

  const bossMax = isBoss ? Math.max(4, level!.boss!.hp - (store.bossWounds[level!.id] ?? 0)) : 0;
  const [bossHp, setBossHp] = useState(bossMax);
  const [hearts, setHearts] = useState(HEARTS);
  const [seals, setSeals] = useState<Set<string>>(new Set());

  const run = useRef({ firstTry: 0, total: 0, maxCombo: 0, xp: 0, coins: 0, timeBonus: 0, echoes: 0, damage: 0, retries: {} as Record<string, number> });
  const [time, setTime] = useState(0);
  const ex = queue[idx];
  // Test hook for automated play-throughs (only with ?e2e in the URL).
  if (typeof window !== 'undefined' && window.location.search.includes('e2e')) {
    (window as unknown as { __ex: () => Exercise | undefined }).__ex = () => ex;
  }

  // Reset per exercise.
  useEffect(() => {
    if (!ex) return;
    setValue(null);
    setVerdict(null);
    setTimedOut(false);
    setHidden(new Set());
    if (isTimed) setTime(timeFor(ex, diff, timeBonus));
  }, [ex?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(
    (bossWon?: boolean) => {
      const r = run.current;
      store.finishRun({
        target,
        correctFirstTry: r.firstTry,
        total: r.total,
        maxCombo: r.maxCombo,
        xp: r.xp,
        coins: r.coins,
        timeBonus: r.timeBonus,
        echoesCleared: r.echoes,
        bossWon,
        bossDamage: r.damage,
      });
    },
    [store, target],
  );

  const check = useCallback(
    (forcedWrong = false) => {
      if (!ex || verdict !== null || intro) return;
      const ok = !forcedWrong && value !== null && sameAnswer(value, ex.answer);
      const r = run.current;
      if (!ex.isRetry) r.total++;
      let newCombo = 0;
      if (ok) {
        newCombo = combo + 1;
        setCombo(newCombo);
        r.maxCombo = Math.max(r.maxCombo, newCombo);
        if (!ex.isRetry) r.firstTry++;
        if (ex.isEcho && !ex.isRetry) r.echoes++;
        r.xp += XP_CORRECT + (newCombo >= 3 ? XP_COMBO_BONUS : 0);
        r.coins += COINS_CORRECT;
        if (isTimed) r.timeBonus += Math.floor(time / 4);
        if (isBoss) {
          const dmg = newCombo >= 3 ? 2 : 1;
          r.damage += dmg;
          setBossHp((h) => Math.max(0, h - dmg));
          setHit((h) => h + 1);
          sfx.hit();
        }
        if (isChest) setSeals((s) => new Set(s).add(ex.phrase.id));
        newCombo >= 3 && newCombo % 3 === 0 ? sfx.combo() : sfx.correct();
        setPraise(newCombo >= 3 ? COMBO_PRAISE[Math.floor(newCombo / 3 - 1) % 3] : PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      } else {
        setCombo(0);
        sfx.wrong();
        setPraise(SOFT_MISS[Math.floor(Math.random() * SOFT_MISS.length)]);
        if (isBoss) setHearts((h) => h - 1);
        const n = r.retries[ex.phrase.id] ?? 0;
        if (isBoss || n < MAX_RETRIES) {
          r.retries[ex.phrase.id] = n + 1;
          setQueue((q) => [...q, retryOf(ex, diff)]);
        }
        setTimeout(() => speak(ex.phrase.en), 250);
      }
      setVerdict(ok);
      store.answer(ex.phrase.id, ok, { isEcho: ex.isEcho, isRetry: ex.isRetry, combo: newCombo });
    },
    [ex, verdict, intro, value, combo, isTimed, isBoss, isChest, time, diff, store],
  );

  const next = useCallback(() => {
    if (verdict === null) return;
    if (isBoss) {
      if (bossHp <= 0) return finish(true);
      if (hearts <= 0) return finish(false);
    }
    if (idx + 1 >= queue.length) {
      if (isBoss && bossHp > 0) {
        // Keep the fight going with the hardest phrases of the level.
        const extra = shuffle(level!.phrases).slice(0, 3).map((p) => retryOf({ ...queue[0], phrase: p, type: 'choice' }, 2));
        setQueue((q) => [...q, ...extra]);
        setIdx(idx + 1);
        return;
      }
      return finish(isBoss ? bossHp <= 0 : undefined);
    }
    setIdx(idx + 1);
  }, [verdict, isBoss, bossHp, hearts, idx, queue, level, finish]);

  // Timer for timed challenges.
  useEffect(() => {
    if (!isTimed || verdict !== null || intro || quit || !ex) return;
    if (time <= 0) {
      setTimedOut(true);
      check(true);
      return;
    }
    const t = setTimeout(() => {
      setTime((x) => x - 1);
      if (time <= 4) sfx.tick();
    }, 1000);
    return () => clearTimeout(t);
  }, [isTimed, time, verdict, intro, quit, ex, check]);

  // Keyboard: Enter to check / continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || quit || intro) return;
      if (verdict === null) value && check();
      else next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [verdict, value, check, next, quit, intro]);

  if (!ex) {
    // Nothing to review (e.g. echoes cleared elsewhere).
    return (
      <div className="screen play empty-play">
        <Pip size={120} mood="happy" />
        <h2 className="title-lg">¡No hay Ecos pendientes!</h2>
        <Btn onClick={() => store.go('home')}>Volver</Btn>
      </div>
    );
  }

  const useHint = () => {
    if (!ex.options || verdict !== null || hidden.size) return;
    if (!store.useItem('hint')) return;
    const wrong = ex.options.filter((o) => !sameAnswer(o, ex.answer));
    setHidden(new Set(shuffle(wrong).slice(0, 2)));
    sfx.coin();
  };
  const useTime = () => {
    if (!isTimed || verdict !== null) return;
    if (!store.useItem('time')) return;
    setTime((t) => t + 10);
    sfx.coin();
  };

  const progress = Math.min(idx + (verdict !== null ? 1 : 0), queue.length);
  const maxTime = timeFor(ex, diff, timeBonus);

  return (
    <div className={`screen play ${isBoss ? 'play-boss' : ''} ${ex.isEcho ? 'play-echo' : ''}`}>
      <div className="play-top">
        <button className="icon-btn" onClick={() => setQuit(true)} aria-label="Salir">
          ✕
        </button>
        <Bar value={progress} max={queue.length} color={ex.isEcho ? 'linear-gradient(90deg,#b69cff,#7b61ff)' : 'linear-gradient(90deg,#ffd166,#ff9f1c)'} height={14} className="play-bar" />
        {isBoss ? (
          <div className="hearts">
            {Array.from({ length: HEARTS }).map((_, i) => (
              <motion.span key={i} animate={i === hearts ? { scale: [1, 1.4, 0.8] } : {}}>
                <HeartIcon size={18} filled={i < hearts} />
              </motion.span>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {combo >= 2 && (
              <motion.div key={combo} className="combo" initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                🔥×{combo}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {isBoss && level && (
        <div className="boss-arena">
          <motion.div key={hit} className="boss-sprite" animate={hit ? { x: [0, -12, 10, -6, 0], filter: ['brightness(1)', 'brightness(2.2)', 'brightness(1)'] } : {}} transition={{ duration: 0.45 }}>
            <Npc id={level.character} size={118} mood={bossHp <= 0 ? 'sad' : 'idle'} />
            <AnimatePresence>
              {hit > 0 && verdict === true && (
                <motion.span key={'d' + hit} className="dmg" initial={{ y: 0, opacity: 1 }} animate={{ y: -50, opacity: 0 }} transition={{ duration: 0.9 }}>
                  -{combo >= 3 ? 2 : 1}
                  {combo >= 3 && ' ¡CRÍTICO!'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="boss-hp">
            <b>{level.boss!.name}</b>
            <Bar value={bossHp} max={bossMax} color="linear-gradient(90deg,#ef476f,#ff7b00)" height={12} />
          </div>
        </div>
      )}

      {isChest && (
        <div className="seals">
          {level!.phrases.map((p) => (
            <motion.span key={p.id} className={`seal ${seals.has(p.id) ? 'broken' : ''}`} animate={seals.has(p.id) ? { scale: [1, 1.5, 1], rotate: [0, 20, 0] } : {}}>
              {seals.has(p.id) ? '✦' : '🔒'}
            </motion.span>
          ))}
        </div>
      )}

      {isTimed && (
        <div className={`timer ${time <= 4 ? 'urgent' : ''}`}>
          <span>⏳ {Math.max(0, time)}s</span>
          <Bar value={time} max={maxTime} color={time <= 4 ? '#ef476f' : 'linear-gradient(90deg,#4cc9f0,#06d6a0)'} height={8} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.main key={ex.uid} className="ex-area" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
          {(ex.isEcho || ex.isRetry) && <div className={`ex-tag ${ex.isEcho ? 'tag-echo' : 'tag-retry'}`}>{ex.isEcho ? '🔮 Eco del olvido' : '↻ Otra oportunidad'}</div>}
          <ExerciseView ex={ex} locked={verdict !== null} hidden={hidden} verdict={verdict} onChange={setValue} />
        </motion.main>
      </AnimatePresence>

      <footer className="play-foot">
        {verdict === null && (
          <div className="tools">
            {ex.options && (
              <button className="tool" onClick={useHint} disabled={!store.items.hint || hidden.size > 0}>
                📜 <span>{store.items.hint}</span>
              </button>
            )}
            {isTimed && (
              <button className="tool" onClick={useTime} disabled={!store.items.time}>
                ⏳ <span>{store.items.time}</span>
              </button>
            )}
          </div>
        )}
        <Btn big variant={value ? 'success' : 'secondary'} disabled={!value || verdict !== null} onClick={() => check()}>
          Comprobar
        </Btn>
      </footer>

      <AnimatePresence>
        {verdict !== null && (
          <motion.div className={`sheet ${verdict ? 'sheet-ok' : 'sheet-ko'}`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            {verdict && <Burst count={combo >= 3 ? 26 : 14} spread={combo >= 3 ? 170 : 110} />}
            <div className="sheet-head">
              <div className="sheet-pip">
                <Pip size={54} mood={verdict ? 'happy' : 'sad'} />
              </div>
              <div>
                <h3>{timedOut ? '¡Se acabó el tiempo!' : praise}</h3>
                {verdict ? (
                  <span className="gain">
                    +{XP_CORRECT + (combo >= 3 ? XP_COMBO_BONUS : 0)} XP · +{COINS_CORRECT} 🪙
                  </span>
                ) : (
                  <span className="gain soft">Sin penalización. ¡Vamos a aprenderla!</span>
                )}
              </div>
            </div>
            {!verdict && (
              <div className="sheet-body">
                <div className="sheet-line">
                  <small>Respuesta correcta</small>
                  <b>{ex.type === 'fill' ? plain(ex.phrase.es) : ex.answer}</b>
                </div>
                <div className="sheet-line en">
                  <small>En inglés</small>
                  <span>
                    {ex.phrase.en} <SpeakBtn text={ex.phrase.en} small />
                  </span>
                </div>
                {value && !timedOut && (
                  <div className="sheet-line yours">
                    <small>Tu respuesta</small>
                    <s>{value}</s>
                  </div>
                )}
                <div className="sheet-tip">
                  <b>💡 ¿Por qué?</b> {ex.phrase.tip}
                </div>
                <small className="sheet-echo">🔮 Esta frase volverá más tarde como Eco para que la domines.</small>
              </div>
            )}
            {verdict && (
              <div className="sheet-body compact">
                <span className="sheet-en">
                  “{ex.phrase.en}” <SpeakBtn text={ex.phrase.en} small />
                </span>
              </div>
            )}
            <Btn big variant={verdict ? 'success' : 'primary'} onClick={next}>
              {isBoss && (bossHp <= 0 || hearts <= 0) ? 'Ver resultado' : 'Continuar'}
            </Btn>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro for special levels */}
      <Modal open={intro} className="intro-modal">
        {level && (
          <>
            <div className="intro-portrait">
              {isChest ? <div className="float" style={{ fontSize: 84 }}>🧰</div> : <Npc id={level.character} size={isBoss ? 150 : 100} />}
            </div>
            <h2 className="title-lg">{isBoss ? level.boss!.name : level.title}</h2>
            <p className="intro-text">
              {isBoss
                ? `“${level.boss!.taunt}”`
                : isChest
                  ? 'Cada frase correcta rompe un sello. ¡Rómpelos todos para abrir el cofre!'
                  : `Cada frase tiene un tiempo límite. El tiempo que te sobre se convierte en monedas.${timeBonus ? ' (Musgo te da +5 s)' : ''}`}
            </p>
            {isBoss && (
              <p className="intro-rules">
                ⚔️ Cada acierto le hace daño · 🔥 Combo ×3 = golpe crítico
                <br />
                ❤️ Tienes {HEARTS} corazones{(store.bossWounds[level.id] ?? 0) > 0 ? ' · 🩹 El boss sigue herido de tu último intento' : ''}
              </p>
            )}
            <Btn big variant={isBoss ? 'danger' : 'primary'} onClick={() => setIntro(false)}>
              {isBoss ? '¡Luchar!' : '¡Vamos!'}
            </Btn>
          </>
        )}
      </Modal>

      <Modal open={quit} onClose={() => setQuit(false)}>
        <Pip size={90} mood="sad" />
        <h2 className="title-lg">¿Abandonar la aventura?</h2>
        <p className="muted">Perderás el progreso de este nivel, pero tus Ecos y monedas se quedan.</p>
        <div className="modal-actions">
          <Btn variant="primary" onClick={() => setQuit(false)}>
            Seguir jugando
          </Btn>
          <Btn variant="ghost" onClick={() => store.go(level ? 'map' : 'home')}>
            Salir
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
