import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../audio/sfx';
import { keyFor, play, stop as stopVoice, toggle, useAudio, type Clip } from '../audio/voice';
import { Bar, Btn, Icon } from '../components/ui';
import { say } from '../data/voice';
import { roundId } from '../data/voiceacting';
import { dayKey } from '../engine/date';
import { gateFor } from '../engine/gate';
import { XP_BY_LEVEL, XP_COMBO_BONUS } from '../engine/progression';
import { buildVoice, type VoiceRound } from '../engine/session';
import { useServices } from '../services/api';
import { useGame } from '../store/game';

const LETTERS = 'ABCD';
/** Acting is the content here: never replace it with the flat device voice. */
const NOFB = { fallback: false };
const clipOf = (r: VoiceRound, slow = false): Clip => ({ text: r.line.text, tone: r.delivery.tone, slow, voice: 'main' });

/** Big play control: real audio state (loading / playing / paused), never decorative. */
function Stage({ clip, label }: { clip: Clip; label: string }) {
  const a = useAudio();
  const k = keyFor([clip]);
  const mine = a.key === k;
  const st = mine ? a.status : 'idle';
  return (
    <button className={`stage-play st-${st}`} onClick={() => toggle([clip], label, NOFB)} aria-label={st === 'playing' ? 'Pausar' : st === 'loading' ? 'Cargando audio' : 'Escuchar'}>
      <span className="wave" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <i key={i} style={{ animationDelay: `${(i % 5) * 0.09}s` }} />
        ))}
      </span>
      <span className="stage-label">{st === 'loading' ? 'Generando la interpretación…' : st === 'playing' ? 'Escuchando · toca para pausar' : st === 'paused' ? 'En pausa · toca para seguir' : 'Toca para escuchar'}</span>
    </button>
  );
}

export function VoiceActing() {
  const store = useGame();
  const services = useServices();
  const startGate = useMemo(() => gateFor(useGame.getState().reviewLock, dayKey()), []);
  const rounds = useMemo(() => {
    const st = useGame.getState();
    return buildVoice(st.extra, { allowNew: startGate.canLearnNew, priority: startGate.state === 'review-first' ? startGate.pending : [] });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [heard, setHeard] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [line, setLine] = useState('');
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const acc = useRef({ total: 0, firstTry: 0, maxCombo: 0, xp: 0, missed: [] as string[], mistakes: new Set<string>(), t0: Date.now() });
  const r = rounds[i];
  const audio = useAudio();

  useEffect(() => {
    services.load();
    return () => stopVoice();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Answers unlock only once this round's audio has actually started playing.
  useEffect(() => {
    if (!r || heard) return;
    const keys = [keyFor([clipOf(r)]), keyFor([clipOf(r, true)])];
    if (audio.status === 'playing' && audio.key && keys.includes(audio.key)) setHeard(true);
  }, [audio.status, audio.key, r, heard]);

  // Test hook (only with ?e2e in the URL).
  if (typeof window !== 'undefined' && window.location.search.includes('e2e')) (window as unknown as { __voice: unknown }).__voice = () => r && { id: roundId(r.line.id, r.delivery.id), intent: r.delivery.intent, tone: r.delivery.tone, options: r.options };

  const begin = (idx: number) => {
    const next = rounds[idx];
    setI(idx);
    setHeard(false);
    setPicked(null);
    if (next) play([clipOf(next)], next.line.text, NOFB); // called from the click: allowed to make sound
  };

  const finish = useCallback(() => {
    const a = acc.current;
    store.finishRun({ run: { kind: 'voice' }, total: a.total, firstTry: a.firstTry, maxCombo: a.maxCombo, xp: a.xp, newIds: [], missedIds: a.missed, mistakes: [...a.mistakes], gateAtStart: startGate.state, ms: Date.now() - a.t0 });
  }, [store, startGate]);

  const choose = (intent: string) => {
    if (!r || picked || !heard) return;
    const ok = intent === r.delivery.intent;
    const id = roundId(r.line.id, r.delivery.id);
    const a = acc.current;
    a.total++;
    const next = ok ? combo + 1 : 0;
    setCombo(next);
    a.maxCombo = Math.max(a.maxCombo, next);
    store.answerExtra(id, ok, { mode: 'voice', combo: next });
    if (ok) {
      a.firstTry++;
      a.xp += XP_BY_LEVEL[r.line.level] + (next >= 3 ? XP_COMBO_BONUS : 0);
      next >= 3 && next % 3 === 0 ? sfx.streak() : sfx.correct();
      setLine(say(next >= 3 ? 'streak' : 'tone'));
    } else {
      sfx.wrong();
      a.missed.push(id);
      a.mistakes.add(id);
      setMisses(a.mistakes.size);
      setLine(say('wrongTone'));
    }
    setPicked(intent);
  };

  const tts = services.status?.tts;
  // The device voice cannot act out emotions, so this mode never falls back to it.
  if (services.loaded && !tts?.ready)
    return (
      <div className="screen center-screen voice-off">
        <div className="eyebrow">♪ Voice Acting</div>
        <p className="serif-lg">This mode needs the AI voice.</p>
        <p className="muted">
          Voice Acting depende de que la misma frase suene con emociones distintas, y eso solo lo consigue la voz IA. La voz del dispositivo no puede interpretar tonos, así
          que no la usamos aquí para no darte audio engañoso.
        </p>
        <p className="note">
          {tts?.missing
            ? `Falta configurar ${tts.missing} en el archivo .env del servidor.`
            : services.error ?? 'No se encuentra el servidor de IA de la app (npm start).'}
        </p>
        <div className="row-actions">
          <Btn variant="ghost" onClick={() => store.quit()}>
            Volver
          </Btn>
          <Btn onClick={() => store.start({ kind: 'twist' })}>Jugar The Unexpected Twist</Btn>
        </div>
      </div>
    );

  if (!rounds.length)
    return (
      <div className="screen center-screen">
        <div className="eyebrow">♪ Voice Acting</div>
        <p className="serif-lg">Nothing to replay yet.</p>
        <p className="muted">Hoy toca repasar lo que ya has escuchado y todavía no has jugado ninguna ronda. El contenido nuevo vuelve {startGate.state === 'review-first' ? 'en cuanto termines el repaso' : 'mañana'}.</p>
        <Btn onClick={() => store.quit()}>Volver</Btn>
      </div>
    );

  if (!started)
    return (
      <div className="screen drill-intro">
        <button className="icon-btn" onClick={() => store.quit()} aria-label="Salir">
          <Icon name="x" size={18} />
        </button>
        <div className="eyebrow">♪ Voice Acting</div>
        <h1 className="display">Same words. Different meaning.</h1>
        <p className="muted lead">Vas a escuchar frases cortas interpretadas por la voz IA. Las palabras no cambian: cambia cómo se dicen. Tu trabajo es oír la intención.</p>
        <ul className="rules">
          <li>Escucha antes de responder (puedes repetir y ponerla a 0.7×).</li>
          <li>Tras cada respuesta, compara las otras interpretaciones de la misma frase.</li>
          <li>{rounds.length} rondas · auriculares recomendados</li>
        </ul>
        <Btn
          wide
          disabled={!services.loaded}
          onClick={() => {
            setStarted(true);
            acc.current.t0 = Date.now();
            begin(0);
          }}
        >
          Empezar <Icon name="arrow" size={16} />
        </Btn>
      </div>
    );

  const ok = picked === r.delivery.intent;
  return (
    <div className="screen voice">
      <header className="play-top">
        <button className="icon-btn" onClick={() => store.quit()} aria-label="Salir">
          <Icon name="x" size={18} />
        </button>
        <Bar value={i + (picked ? 1 : 0)} max={rounds.length} className="play-bar" />
        {misses > 0 ? (
          <span className={`misses ${misses >= 3 ? 'over' : ''}`}>
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

      <motion.div key={`${r.line.id}-${r.delivery.id}-${i}`} className="voice-body" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="twist-head">
          <div className="eyebrow">♪ Voice Acting · ronda {i + 1}</div>
          <span className="stage-flags">
            {r.isReview && <span className="flag">Repaso</span>}
            <span className={`lvl lvl-${r.line.level}`}>{r.line.level}</span>
          </span>
        </div>
        <p className="voice-line">“{r.line.text}”</p>
        <Stage clip={clipOf(r)} label={r.line.text} />
        <div className="voice-tools">
          <button className="speak speak-slow" onClick={() => toggle([clipOf(r, true)], r.line.text, NOFB)} aria-label="Escuchar despacio">
            0.7× despacio
          </button>
          <button className="speak" onClick={() => play([clipOf(r)], r.line.text, NOFB)} aria-label="Repetir">
            <Icon name="refresh" size={15} /> Otra vez
          </button>
        </div>
        {audio.status === 'error' && <p className="pron-error">{audio.error} Puedes reintentarlo con «Otra vez».</p>}

        <p className="twist-question">What is the speaker really expressing?</p>
        {!heard && <p className="note">Escucha la frase para desbloquear las respuestas.</p>}
        <div className="readings">
          {r.options.map((o, k) => {
            const state = !picked ? '' : o === r.delivery.intent ? 'right' : o === picked ? 'wrong' : 'dim';
            return (
              <button key={o} className={`reading ${state}`} disabled={!heard || !!picked} onClick={() => choose(o)}>
                <span className="reading-key">{LETTERS[k]}</span>
                <span>{o}</span>
              </button>
            );
          })}
        </div>

        {picked && (
          <motion.section className={`subtext ${ok ? 'ok' : 'ko'}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="subtext-top">
              <span className={`verdict-mark ${ok ? 'ok' : 'ko'}`}>
                <Icon name={ok ? 'check' : 'x'} size={15} />
              </span>
              <p className="verdict-line">{line}</p>
            </div>
            <p className="verdict-answer">
              <small>Intención</small> {r.delivery.intent} · {r.delivery.es}
            </p>
            <div className="label">Por qué el tono cambia el significado</div>
            <p className="subtext-explain">{r.delivery.explain}</p>
            <p className="note">{r.line.context}</p>
            <div className="label">Compara las interpretaciones</div>
            <ul className="takes">
              {r.line.deliveries.map((d) => {
                const c: Clip = { text: r.line.text, tone: d.tone, voice: 'main' };
                const st = audio.key === keyFor([c]) ? audio.status : 'idle';
                return (
                  <li key={d.id} className={d.id === r.delivery.id ? 'this' : ''}>
                    <button className={`take speak-${st}`} onClick={() => toggle([c], `${r.line.text} · ${d.intent}`, NOFB)}>
                      <Icon name={st === 'playing' ? 'pause' : 'play'} size={13} fill />
                      <span>
                        <b>{d.intent}</b>
                        <small>{d.es}</small>
                      </span>
                      {d.id === r.delivery.id && <em>la que has oído</em>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Btn wide onClick={() => (i + 1 >= rounds.length ? finish() : begin(i + 1))}>
              {i + 1 >= rounds.length ? 'Ver resultado' : 'Siguiente frase'} <Icon name="arrow" size={16} />
            </Btn>
          </motion.section>
        )}
      </motion.div>
    </div>
  );
}
