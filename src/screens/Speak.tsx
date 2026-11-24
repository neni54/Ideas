// SIDEYE SPEAK · "Don't just understand it. Say it."
// Free version: device voices (SpeechSynthesis), the browser's own speech recognition when it
// exists (always with a typed alternative) and prepared branching conversations. No API keys,
// no paid services, no audio uploaded or stored.
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Highlight } from '../components/ExpressionCard';
import { Btn, Icon } from '../components/ui';
import { ALL, ALL_LIST, plain } from '../data/content';
import { useGame } from '../store/game';
import { compare, similarity, type Comparison } from '../speak/compare';
import { DIALOGUES, TONE_LABEL, expressionsIn, routesIn, type Choice, type Dialogue, type Line } from '../speak/dialogues';
import { hush, say, useSpeakNav, useSpeakPlayer } from '../speak/player';
import { LISTEN_MESSAGES, listen, recognitionExists, recognitionUsable, type Listening } from '../speak/recognition';
import { canRecord, discard, playUrl, record, stopPlayback, type Recording } from '../speak/recorder';
import { englishVoices, loadVoices, useSpeakPrefs, type DeviceVoice } from '../speak/voices';
import { canBrowserSpeak } from '../audio/speech';

export const SPEAK_TAGLINE = "Don't just understand it. Say it.";

/** Root: picks the SPEAK view. Practice and chat are full-screen (immersive). */
export function SpeakScreen() {
  const view = useSpeakNav((s) => s.view);
  useEffect(() => () => hush(), []);
  if (view.name === 'voices') return <VoicesView />;
  if (view.name === 'practice') return <PracticeView ids={view.ids} />;
  if (view.name === 'chat') return <ChatView id={view.id} />;
  return <Hub />;
}
export const speakIsImmersive = () => ['practice', 'chat'].includes(useSpeakNav.getState().view.name);

/* ───── shared bits ───── */

function useVoices(): { voices: DeviceVoice[]; ready: boolean } {
  const [voices, setVoices] = useState<DeviceVoice[]>(() => englishVoices());
  const [ready, setReady] = useState(voices.length > 0 || !canBrowserSpeak());
  useEffect(() => {
    if (!canBrowserSpeak()) return;
    let live = true;
    const refresh = () => live && setVoices(englishVoices());
    loadVoices().then(() => {
      refresh();
      if (live) setReady(true);
    });
    speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => {
      live = false;
      speechSynthesis.removeEventListener('voiceschanged', refresh);
    };
  }, []);
  return { voices, ready };
}

function SayButton({ k, text, slow, label, small }: { k: string; text: string; slow?: boolean; label?: string; small?: boolean }) {
  const { key, status } = useSpeakPlayer();
  const active = key === k && status !== 'idle';
  return (
    <button className={`sp-say ${small ? 'sp-say-sm' : ''} ${active ? 'on' : ''}`} onClick={() => say(k, text, { slow })} aria-label={active ? 'Parar' : label ?? (slow ? 'Escuchar despacio' : 'Escuchar')}>
      {active ? <Icon name="stop" size={small ? 14 : 16} /> : slow ? <span className="mono">0.7×</span> : <Icon name="volume" size={small ? 15 : 17} />}
      {label && !small && <span>{active ? 'Parar' : label}</span>}
    </button>
  );
}

function PlayerError() {
  const error = useSpeakPlayer((s) => s.error);
  return error ? <p className="sp-note sp-warn">{error}</p> : null;
}

function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sp-top">
      <button className="icon-btn" onClick={onBack} aria-label="Volver">
        <Icon name="x" size={18} />
      </button>
      <span className="sp-top-title">{title}</span>
      <span className="sp-brand">SPEAK</span>
    </header>
  );
}

/** Learned expressions (seen in lessons), newest first. Falls back to starter phrases. */
function learnedIds(cards: Record<string, { first?: number }>): { ids: string[]; starter: boolean } {
  const ids = Object.keys(cards)
    .filter((id) => ALL[id])
    .sort((a, b) => (cards[b].first ?? 0) - (cards[a].first ?? 0));
  if (ids.length) return { ids, starter: false };
  return { ids: ALL_LIST.filter((x) => x.pack === 'everyday' || x.pack === 'sarcasm').map((x) => x.id), starter: true };
}

/* ───── Hub ───── */

function Hub() {
  const open = useSpeakNav((s) => s.open);
  const go = useGame((s) => s.go);
  const tab = useGame((s) => s.tab);
  const cards = useGame((s) => s.cards);
  const prefs = useSpeakPrefs();
  const { voices, ready } = useVoices();
  const { ids, starter } = learnedIds(cards);
  const voice = voices.find((v) => v.id === prefs.voiceId) ?? voices[0];
  const rec = !recognitionExists() ? 'none' : prefs.recognition === 'failed' ? 'failed' : prefs.recognition === 'works' ? 'works' : 'untested';
  const ordered = useMemo(
    () => [...DIALOGUES].map((d) => ({ d, known: expressionsIn(d).filter((x) => cards[x]).length })).sort((a, b) => b.known - a.known),
    [cards],
  );

  return (
    <div className="screen speak-hub">
      <button className="sp-back-link" onClick={() => go(tab === 'speak' ? 'games' : tab)}>
        ← Volver
      </button>
      <header className="sp-hero">
        <div className="eyebrow">Nuevo · gratis · en tu móvil</div>
        <h1 className="sp-title">
          SIDEYE <em>SPEAK</em>
        </h1>
        <p className="sp-tagline">{SPEAK_TAGLINE}</p>
        <p className="muted">Escucha, repite y conversa con frases que ya has aprendido. Usa la voz y el micrófono de tu propio dispositivo: sin servidores ni coste.</p>
      </header>

      <div className="sp-status">
        <button className="sp-chip" onClick={() => open({ name: 'voices' })}>
          <Icon name="volume" size={15} />
          {!canBrowserSpeak() ? 'Sin voces en este navegador' : !ready ? 'Buscando voces…' : voice ? voice.label : 'Sin voz en inglés'}
        </button>
        <span className={`sp-chip ${rec === 'works' ? 'ok' : rec === 'none' || rec === 'failed' ? 'off' : ''}`}>
          <Icon name="mic" size={15} />
          {rec === 'works' ? 'Reconocimiento de voz activo' : rec === 'untested' ? 'Reconocimiento: se comprueba al usarlo' : 'Respuesta escrita (sin reconocimiento)'}
        </span>
      </div>

      <button className="sp-card sp-card-main" onClick={() => open({ name: 'practice' })}>
        <span className="eyebrow">Pronunciación</span>
        <b>Escucha. Repite. Compara.</b>
        <small>{starter ? 'Empezamos con frases básicas: las tuyas aparecerán al hacer lecciones.' : `${ids.length} frases que ya has aprendido`}</small>
        <span className="sp-card-go">
          Practicar <Icon name="arrow" size={16} />
        </span>
      </button>

      <section className="sp-section">
        <div className="label">Conversaciones guiadas</div>
        <p className="sp-note">Diálogos preparados con varias rutas: tus respuestas cambian lo que pasa. No es una IA: son conversaciones escritas para practicar.</p>
        <ul className="sp-dialogues">
          {ordered.map(({ d, known }) => (
            <li key={d.id}>
              <button onClick={() => open({ name: 'chat', id: d.id })}>
                <span className="sp-d-cat">{d.cat}</span>
                <b>{d.title}</b>
                <small>
                  {d.partner.name} · {routesIn(d)} rutas{known ? ` · ${known} frases que ya conoces` : ''}
                </small>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button className="sp-card" onClick={() => open({ name: 'voices' })}>
        <span className="eyebrow">Ajustes</span>
        <b>Voz y velocidad</b>
        <small>Elige entre las voces en inglés de tu dispositivo y escucha cada una.</small>
      </button>

      <p className="sp-privacy">
        Privacidad: SIDEYE no graba ni envía tu voz a ningún servidor. Si usas el micrófono para el reconocimiento, quien transcribe es tu propio navegador (Safari usa el dictado de Apple; Chrome, el de Google). La opción escrita funciona siempre.
      </p>
    </div>
  );
}

/* ───── Voice settings ───── */

const SAMPLE = "Don't just understand it. Say it.";

function SampleButton({ id, label, k }: { id?: string; label: string; k?: string }) {
  const key = k ?? `sample-${id}`;
  const { key: playing, status } = useSpeakPlayer();
  const on = playing === key && status !== 'idle';
  return (
    <button className={`sp-sample ${on ? 'on' : ''}`} onClick={() => say(key, SAMPLE, { voiceId: id })} aria-label={on ? 'Parar' : `Escuchar ${label}`}>
      <Icon name={on ? 'stop' : 'volume'} size={15} />
      <span>{on ? 'Parar' : 'Muestra'}</span>
    </button>
  );
}

function VoicesView() {
  const open = useSpeakNav((s) => s.open);
  const prefs = useSpeakPrefs();
  const { voices, ready } = useVoices();
  const us = voices.filter((v) => v.group === 'us');
  const others = voices.filter((v) => v.group !== 'us');
  const current = voices.find((v) => v.id === prefs.voiceId);
  const Row = ({ v }: { v: DeviceVoice }) => (
    <li className={`sp-voice ${prefs.voiceId === v.id ? 'on' : ''}`}>
      <button className="sp-voice-pick" onClick={() => prefs.setVoice(v.id)} aria-pressed={prefs.voiceId === v.id}>
        <span className="sp-radio" />
        <span className="sp-voice-name">
          <b>{v.label}</b>
          <small>
            {v.lang}
            {v.gender === null ? ' · género no identificado' : ''}
          </small>
        </span>
      </button>
      <SampleButton id={v.id} label={v.label} />
    </li>
  );
  return (
    <div className="screen speak-voices">
      <BackBar title="Voz y ajustes" onBack={() => open({ name: 'hub' })} />
      <h1 className="display-sm">Elige tu voz</h1>
      <p className="muted">Solo aparecen las voces en inglés instaladas en este dispositivo. Indicamos si es femenina o masculina solo cuando lo sabemos con certeza.</p>
      {!canBrowserSpeak() && <p className="sp-note sp-warn">Este navegador no puede leer en voz alta. Prueba en Safari (iPhone) o Chrome (Android).</p>}
      {canBrowserSpeak() && ready && !voices.length && (
        <p className="sp-note sp-warn">No hay ninguna voz en inglés instalada. En iPhone: Ajustes → Accesibilidad → Contenido leído → Voces → Inglés. Mientras tanto, el dispositivo usará su voz por defecto.</p>
      )}
      {canBrowserSpeak() && !ready && <p className="muted">Buscando voces…</p>}
      <PlayerError />

      <ul className="sp-voices">
        <li className={`sp-voice ${!prefs.voiceId ? 'on' : ''}`}>
          <button className="sp-voice-pick" onClick={() => prefs.setVoice(null)} aria-pressed={!prefs.voiceId}>
            <span className="sp-radio" />
            <span className="sp-voice-name">
              <b>Automática</b>
              <small>{voices[0] ? `Ahora: ${voices[0].label}` : 'La mejor voz en inglés disponible'}</small>
            </span>
          </button>
          <SampleButton id={voices[0]?.id} label="la voz automática" k="sample-auto" />
        </li>
      </ul>
      {us.length > 0 && (
        <>
          <div className="label">Inglés de Estados Unidos</div>
          <ul className="sp-voices">{us.map((v) => <Row key={v.id} v={v} />)}</ul>
        </>
      )}
      {others.length > 0 && (
        <>
          <div className="label">Otros acentos en inglés</div>
          <ul className="sp-voices">{others.map((v) => <Row key={v.id} v={v} />)}</ul>
        </>
      )}

      <div className="label">Velocidad</div>
      <div className="sp-seg">
        {[
          [0.8, 'Lenta'],
          [0.95, 'Normal'],
          [1.05, 'Rápida'],
        ].map(([r, l]) => (
          <button key={l} className={prefs.rate === r ? 'on' : ''} onClick={() => prefs.setRate(r as number)}>
            {l}
          </button>
        ))}
      </div>
      <label className="toggle" htmlFor="sp-autoread">
        <span>Leer en voz alta las frases de la otra persona en las conversaciones</span>
        <input id="sp-autoread" type="checkbox" checked={prefs.autoRead} onChange={() => prefs.setAutoRead(!prefs.autoRead)} />
        <i />
      </label>
      {current && <p className="sp-note">Voz elegida: {current.label}. Se usará también en el resto de SIDEYE cuando suene la voz del dispositivo.</p>}
      <p className="sp-note">Si tu iPhone tiene pocas voces, puedes descargar más (gratis) en Ajustes → Accesibilidad → Contenido leído → Voces → Inglés.</p>
    </div>
  );
}

/* ───── Answer input: microphone (when it really works) + typed answer (always) ───── */

function AnswerInput({ placeholder, onAnswer, disabled }: { placeholder: string; onAnswer: (text: string, alternatives: string[], spoken: boolean) => void; disabled?: boolean }) {
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const live = useRef<Listening | null>(null);
  const [, force] = useState(0);
  const micOk = recognitionUsable();
  useEffect(() => () => live.current?.abort(), []);

  const start = () => {
    setMsg(null);
    setInterim('');
    hush();
    const l = listen((t) => setInterim(t));
    live.current = l;
    setListening(true);
    l.done
      .then((r) => onAnswer(r.alternatives[0], r.alternatives, true))
      .catch((e) => {
        const m = LISTEN_MESSAGES[e as keyof typeof LISTEN_MESSAGES];
        if (m) setMsg(m);
        force((n) => n + 1); // re-render: recognition may now be marked as unavailable
      })
      .finally(() => {
        setListening(false);
        live.current = null;
      });
  };

  return (
    <div className="sp-answer">
      {micOk && (
        <button className={`sp-mic ${listening ? 'on' : ''}`} disabled={disabled} onClick={() => (listening ? live.current?.stop() : start())}>
          <Icon name={listening ? 'stop' : 'mic'} size={22} />
          <span>{listening ? 'Escuchando… toca para terminar' : 'Hablar'}</span>
        </button>
      )}
      {listening && <p className="sp-interim">{interim || '…'}</p>}
      {msg && <p className="sp-note sp-warn">{msg}</p>}
      <form
        className="sp-type"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onAnswer(text.trim(), [text.trim()], false);
          setText('');
        }}
      >
        <input id="sp-answer-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={micOk ? `O escríbela: ${placeholder}` : placeholder} autoComplete="off" autoCapitalize="sentences" disabled={disabled} />
        <button type="submit" aria-label="Enviar" disabled={disabled || !text.trim()}>
          <Icon name="arrow" size={18} />
        </button>
      </form>
      {!micOk && (
        <p className="sp-note">
          {recognitionExists()
            ? 'El reconocimiento de voz no funciona en este modo del navegador (pasa a menudo en la app instalada del iPhone). Escribe la frase; para practicar en voz alta usa "Grabarme y comparar".'
            : 'Tu navegador no tiene reconocimiento de voz. Escribe la frase; para practicar en voz alta usa "Grabarme y comparar".'}
        </p>
      )}
    </div>
  );
}

function ComparisonView({ c, heard, spoken }: { c: Comparison; heard: string; spoken: boolean }) {
  return (
    <div className="sp-compare">
      <div className="label">{spoken ? 'Tu navegador ha entendido' : 'Has escrito'}</div>
      <p className="sp-heard">“{heard}”</p>
      <p className="sp-tokens">
        {c.tokens.map((t, i) => (
          <span key={i} className={`tk tk-${t.state}`} title={t.heard ? `Se entendió: ${t.heard}` : undefined}>
            {t.state === 'extra' ? `+${t.heard}` : t.word}
            {t.state === 'different' && t.heard && <small>{t.heard}</small>}
          </span>
        ))}
      </p>
      <p className="sp-legend">
        <span className="tk tk-match">coincide</span> <span className="tk tk-different">diferente</span> <span className="tk tk-missing">no aparece</span>{' '}
        <span className="tk tk-extra">de más</span>
      </p>
      <p className="sp-count">
        {c.matched} de {c.total} palabras {spoken ? 'reconocidas' : 'coinciden'}
      </p>
      <ul className="sp-tips">
        {c.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="sp-honest">
        {spoken
          ? 'Esto compara las palabras que ha reconocido tu navegador. No analiza fonemas ni acento: si una palabra no se reconoce, puede deberse al ruido o al micrófono. Usa "Grabarme y comparar" para escucharte.'
          : 'Comparación de texto: comprueba la frase, no la pronunciación. Para practicar en voz alta, usa "Grabarme y comparar".'}
      </p>
    </div>
  );
}

/** Record yourself, then hear the model voice and your take one after the other. Memory only. */
function SelfCompare({ text, k }: { text: string; k: string }) {
  const [state, setState] = useState<'idle' | 'rec' | 'ready' | 'playing' | 'error'>('idle');
  const [url, setUrl] = useState<string | null>(null);
  const live = useRef<Recording | null>(null);
  useEffect(
    () => () => {
      live.current?.stop();
      stopPlayback();
    },
    [],
  );
  useEffect(() => () => discard(url), [url]);
  if (!canRecord()) return null;
  const start = () => {
    hush();
    setState('rec');
    const r = record();
    live.current = r;
    r.done
      .then((u) => {
        setUrl(u);
        setState('ready');
      })
      .catch(() => setState('error'));
  };
  const compareNow = async () => {
    if (!url) return;
    setState('playing');
    await say(`${k}-model`, text);
    await new Promise((r) => setTimeout(r, 350));
    await playUrl(url);
    setState('ready');
  };
  return (
    <div className="sp-self">
      {state === 'rec' ? (
        <Btn variant="secondary" onClick={() => live.current?.stop()}>
          <Icon name="stop" size={16} /> Parar grabación
        </Btn>
      ) : (
        <Btn variant="ghost" onClick={start}>
          <Icon name="mic" size={16} /> {url ? 'Grabarme otra vez' : 'Grabarme y comparar'}
        </Btn>
      )}
      {url && state !== 'rec' && (
        <Btn variant="secondary" onClick={compareNow} disabled={state === 'playing'}>
          <Icon name="play" size={14} /> {state === 'playing' ? 'Original → tú…' : 'Escuchar original y mi voz'}
        </Btn>
      )}
      {state === 'error' && <p className="sp-note sp-warn">No se pudo usar el micrófono. Revisa el permiso en Ajustes del iPhone → Safari → Micrófono.</p>}
      {state === 'rec' && <p className="sp-note">Grabando (máximo 8 segundos). Tu voz se queda solo en este dispositivo y se borra al pasar a la siguiente frase.</p>}
    </div>
  );
}

/* ───── Pronunciation practice ───── */

function PracticeView({ ids: given }: { ids?: string[] }) {
  const open = useSpeakNav((s) => s.open);
  const cards = useGame((s) => s.cards);
  const [queue] = useState(() => {
    const { ids } = learnedIds(cards);
    const src = given?.length ? given : ids;
    return [...src].sort(() => Math.random() - 0.5).slice(0, 6);
  });
  const starter = !given?.length && learnedIds(cards).starter;
  const [i, setI] = useState(0);
  const [result, setResult] = useState<{ c: Comparison; heard: string; spoken: boolean } | null>(null);
  const x = ALL[queue[i]];
  if (!x)
    return (
      <div className="screen center-screen">
        <p className="serif-lg">Nada que practicar todavía.</p>
        <Btn onClick={() => open({ name: 'hub' })}>Volver</Btn>
      </div>
    );
  const target = plain(x.en);
  const next = () => {
    hush();
    setResult(null);
    if (i + 1 >= queue.length) open({ name: 'hub' });
    else setI(i + 1);
  };
  return (
    <div className="screen speak-practice">
      <BackBar title={`Pronunciación · ${i + 1}/${queue.length}`} onBack={() => open({ name: 'hub' })} />
      {starter && i === 0 && <p className="sp-note">Aún no has hecho lecciones: practicamos con frases básicas.</p>}
      <AnimatePresence mode="wait">
        <motion.section key={x.id} className="sp-phrase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <div className="eyebrow">1 · Escucha</div>
          <blockquote className="sp-en">
            <Highlight en={x.en} />
          </blockquote>
          <div className="sp-listen">
            <SayButton k={`p-${x.id}`} text={target} label="Escuchar" />
            <SayButton k={`p-${x.id}-slow`} text={target} slow label="Despacio" />
          </div>
          <PlayerError />
          <p className="sp-es">{x.es}</p>
          <p className="sp-explain">{x.meaning}</p>

          <div className="eyebrow">2 · Repite</div>
          {!result ? (
            <AnswerInput placeholder={target} onAnswer={(t, alts, spoken) => {
              // Of the browser's alternatives, keep the one closest to the phrase.
              const best = alts.reduce((a, b) => (similarity(b, target) > similarity(a, target) ? b : a), t);
              setResult({ c: compare(target, best), heard: best, spoken });
            }} />
          ) : (
            <>
              <ComparisonView {...result} />
              <div className="sp-row">
                <Btn variant="ghost" onClick={() => setResult(null)}>
                  <Icon name="refresh" size={16} /> Repetir
                </Btn>
                <Btn onClick={next}>{i + 1 >= queue.length ? 'Terminar' : 'Siguiente'}</Btn>
              </div>
            </>
          )}
          <div className="eyebrow">3 · Escúchate</div>
          <SelfCompare key={x.id} text={target} k={`p-${x.id}`} />
          {!result && (
            <button className="sp-skip" onClick={next}>
              Saltar esta frase
            </button>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

/* ───── Conversations ───── */

type Msg = { who: 'them' | 'me'; line: Line; tone?: Choice['tone']; heard?: string };

function ChatView({ id }: { id: string }) {
  const open = useSpeakNav((s) => s.open);
  const cards = useGame((s) => s.cards);
  const autoRead = useSpeakPrefs((s) => s.autoRead);
  const d = DIALOGUES.find((x) => x.id === id) as Dialogue;
  const [turnId, setTurnId] = useState(d.start);
  const [log, setLog] = useState<Msg[]>(() => d.turns[d.start].them.map((line) => ({ who: 'them', line })));
  const [picked, setPicked] = useState<Choice | null>(null);
  const [hint, setHint] = useState<{ heard: string; maybe?: Choice } | null>(null);
  const [showEs, setShowEs] = useState(false);
  const [sayIt, setSayIt] = useState<{ c: Comparison; heard: string; spoken: boolean } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const turn = d.turns[turnId];
  const used = useMemo(() => [...new Set(log.map((m) => m.line.x).filter(Boolean) as string[])], [log]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [log.length, picked, hint, sayIt]);

  const readLines = async (lines: Line[]) => {
    if (!autoRead) return;
    for (const [k, l] of lines.entries()) await say(`c-${turnId}-${k}-${l.en}`, l.en);
  };

  const choose = (c: Choice, heard?: string) => {
    setHint(null);
    setSayIt(null);
    setPicked(c);
    setLog((l) => [...l, { who: 'me', line: c, tone: c.tone, heard }]);
  };
  const answer = (text: string, alts: string[]) => {
    const options = turn.choices ?? [];
    let best: Choice | undefined;
    let score = 0;
    for (const o of options)
      for (const a of alts) {
        const s = similarity(a, o.en);
        if (s > score) [score, best] = [s, o];
      }
    if (best && score >= 0.6) choose(best, text);
    else setHint({ heard: text, maybe: best && score >= 0.3 ? best : undefined });
  };
  const advance = () => {
    if (!picked) return;
    const next = d.turns[picked.next];
    setPicked(null);
    setSayIt(null);
    setTurnId(picked.next);
    setLog((l) => [...l, ...next.them.map((line) => ({ who: 'them' as const, line }))]);
    readLines(next.them);
  };
  const restart = () => {
    hush();
    setTurnId(d.start);
    setLog(d.turns[d.start].them.map((line) => ({ who: 'them', line })));
    setPicked(null);
    setHint(null);
    setSayIt(null);
  };
  const ended = !turn.choices?.length && !picked;

  return (
    <div className="screen speak-chat">
      <BackBar title={d.cat} onBack={() => open({ name: 'hub' })} />
      <div className="sp-chat-head">
        <span className="sp-avatar">{d.partner.name[0]}</span>
        <span>
          <b>{d.partner.name}</b>
          <small>{d.partner.role}</small>
        </span>
        <button className={`sp-es-toggle ${showEs ? 'on' : ''}`} onClick={() => setShowEs(!showEs)}>
          ES
        </button>
      </div>
      <p className="sp-setup">{d.setup}</p>
      {log.length <= d.turns[d.start].them.length && (
        <Btn variant="secondary" onClick={() => readLines(d.turns[d.start].them)}>
          <Icon name="volume" size={16} /> Empezar a escuchar
        </Btn>
      )}
      <PlayerError />

      <div className="sp-log">
        {log.map((m, k) => (
          <div key={k} className={`sp-msg sp-${m.who}`}>
            <div className="sp-bubble">
              <p>{m.line.en}</p>
              {(showEs || m.who === 'me') && <small className="sp-msg-es">{m.line.es}</small>}
              {m.who === 'them' && <SayButton k={`c-msg-${k}`} text={m.line.en} small />}
            </div>
            {m.who === 'them' && m.line.note && <p className="sp-msg-note">{m.line.note}</p>}
            {m.who === 'me' && m.heard && m.heard.toLowerCase() !== m.line.en.toLowerCase() && <p className="sp-msg-note">Has dicho: “{m.heard}”</p>}
            {m.line.x && ALL[m.line.x] && (
              <p className={`sp-x ${cards[m.line.x] ? 'known' : ''}`}>
                {cards[m.line.x] ? 'Ya la conoces' : 'Frase de SIDEYE'} · <b>{plain(ALL[m.line.x].en)}</b>
              </p>
            )}
          </div>
        ))}

        {picked && (
          <div className="sp-feedback">
            <span className={`sp-tone tone-${picked.tone}`}>{TONE_LABEL[picked.tone]}</span>
            {picked.note && <p>{picked.note}</p>}
            {picked.x && ALL[picked.x] && <p className="sp-x-meaning">{ALL[picked.x].meaning}</p>}
            {!sayIt ? (
              <details className="sp-sayit">
                <summary>Dila en voz alta</summary>
                <div className="sp-listen">
                  <SayButton k={`say-${picked.en}`} text={picked.en} label="Escuchar" />
                </div>
                <AnswerInput placeholder={picked.en} onAnswer={(t, alts, spoken) => {
                  const best = alts.reduce((a, b) => (similarity(b, picked.en) > similarity(a, picked.en) ? b : a), t);
                  setSayIt({ c: compare(picked.en, best), heard: best, spoken });
                }} />
              </details>
            ) : (
              <ComparisonView {...sayIt} />
            )}
            <Btn wide onClick={advance}>
              Continuar <Icon name="arrow" size={16} />
            </Btn>
          </div>
        )}

        {ended && (
          <div className="sp-end">
            <div className="eyebrow">Fin de esta ruta</div>
            <p className="serif-md">{turn.end}</p>
            {used.length > 0 && (
              <>
                <div className="label">Expresiones de esta conversación</div>
                <ul className="sp-used">
                  {used.map((x) => (
                    <li key={x}>
                      <b>{plain(ALL[x].en)}</b> <small>{ALL[x].es}</small>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="sp-row">
              <Btn variant="ghost" onClick={restart}>
                <Icon name="refresh" size={16} /> Probar otra ruta
              </Btn>
              {used.length > 0 && <Btn onClick={() => open({ name: 'practice', ids: used })}>Practicar estas frases</Btn>}
            </div>
            <button className="sp-skip" onClick={() => open({ name: 'hub' })}>
              Volver a SIDEYE SPEAK
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!picked && !ended && turn.choices && (
        <div className="sp-reply">
          <div className="label">Tu respuesta</div>
          <div className="sp-choices">
            {turn.choices.map((c) => (
              <div key={c.en} className="sp-choice">
                <button className="sp-choice-main" onClick={() => choose(c)}>
                  <span>{c.en}</span>
                  {showEs && <small>{c.es}</small>}
                </button>
                <SayButton k={`opt-${c.en}`} text={c.en} small />
              </div>
            ))}
          </div>
          {hint && (
            <div className="sp-hint">
              <p>
                No he encontrado “{hint.heard}” entre las respuestas posibles.{' '}
                {hint.maybe ? '¿Querías decir esta?' : 'Elige una de las opciones o inténtalo otra vez.'}
              </p>
              {hint.maybe && (
                <Btn variant="secondary" onClick={() => choose(hint.maybe!, hint.heard)}>
                  {hint.maybe.en}
                </Btn>
              )}
            </div>
          )}
          <AnswerInput placeholder="di o escribe una de las respuestas" onAnswer={(t, alts) => answer(t, alts)} />
        </div>
      )}
    </div>
  );
}
