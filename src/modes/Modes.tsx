import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '../audio/speech';
import { Highlight, SpeakBtn } from '../components/ExpressionCard';
import { Icon } from '../components/ui';
import { PACK_BY_ID, lineOf, plain, splitChunk } from '../data/content';
import { INTENTS } from '../data/meta';
import type { Challenge, Option } from '../engine/challenges';

export interface ModeProps {
  c: Challenge;
  picked: Option | null;
  hidden: Set<string>;
  onPick: (o: Option) => void;
}

const LETTERS = 'ABCDEF';

function stateOf(o: Option, picked: Option | null) {
  if (!picked) return '';
  if (o.kind === 'right') return 'right';
  if (picked.value === o.value) return 'wrong';
  return 'dim';
}

function OptionList({ c, picked, hidden, onPick, variant = 'rows', labels }: ModeProps & { variant?: 'rows' | 'drafts' | 'hypo'; labels?: boolean }) {
  return (
    <div className={`opts opts-${variant}`}>
      {c.options.map((o, i) => (
        <motion.button
          key={o.value}
          className={`opt ${stateOf(o, picked)} ${hidden.has(o.value) ? 'gone' : ''}`}
          disabled={!!picked || hidden.has(o.value)}
          onClick={() => onPick(o)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: hidden.has(o.value) ? 0.3 : 1, y: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.25 }}
        >
          <span className="opt-key">{variant === 'hypo' ? `H${i + 1}` : LETTERS[i]}</span>
          <span className="opt-text">{o.text}</span>
          {labels && picked && (o.kind === 'right' || picked.value === o.value) && (
            <span className={`opt-label ${o.kind === 'right' ? 'ok' : 'ko'}`}>{o.kind === 'right' ? 'Nativo' : o.kind === 'calque' ? 'Calco del español' : 'No encaja'}</span>
          )}
        </motion.button>
      ))}
    </div>
  );
}

/* 1 ─ What does it really mean? */
export function MeaningView(p: ModeProps) {
  return (
    <>
      <figure className="quote">
        <blockquote>
          <Highlight en={p.c.x.en} />
        </blockquote>
        <SpeakBtn text={plain(p.c.x.en)} />
      </figure>
      <p className="ask">¿Qué significa de verdad?</p>
      <OptionList {...p} />
    </>
  );
}

/* 2 ─ Catch the sarcasm */
export function SarcasmView(p: ModeProps) {
  const { c, picked, hidden, onPick } = p;
  return (
    <>
      <div className="scene">
        <span className="scene-label">Escena</span>
        <p>{c.x.scene}</p>
      </div>
      <figure className="quote quote-line">
        <blockquote>“{plain(lineOf(c.x))}”</blockquote>
        <SpeakBtn text={plain(lineOf(c.x))} />
      </figure>
      <p className="ask">¿En qué tono lo dice?</p>
      <div className="tones">
        {c.options.map((o) => {
          const info = INTENTS.find((i) => i.id === o.value)!;
          return (
            <button key={o.value} className={`tone ${stateOf(o, picked)} ${hidden.has(o.value) ? 'gone' : ''}`} disabled={!!picked || hidden.has(o.value)} onClick={() => onPick(o)}>
              <b>{info.label}</b>
              <small>{info.hint}</small>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* 3 ─ Literal vs natural */
export function NaturalView(p: ModeProps) {
  return (
    <>
      <div className="intent-box">
        <span className="scene-label">Quieres decir</span>
        <p className="intent-es">{p.c.x.es}</p>
      </div>
      <p className="ask">¿Cómo lo diría alguien nativo?</p>
      <OptionList {...p} variant="drafts" labels />
    </>
  );
}

/* 4 ─ What would you say? (chat) */
export function ReplyView(p: ModeProps) {
  const { c, picked, hidden, onPick } = p;
  const name = ['Alex', 'Sam', 'Jordan', 'Riley', 'Morgan', 'Casey'][c.x.id.length % 6];
  return (
    <>
      <div className="chat">
        <div className="chat-head">
          <span className="avatar">{name[0]}</span>
          <div>
            <b>{name}</b>
            <small>{picked ? (picked.kind === 'right' ? 'typing…' : 'seen') : 'online'}</small>
          </div>
        </div>
        <p className="chat-context">{c.x.scene}</p>
        <div className="msg in">
          {c.x.cue[0]}
          <SpeakBtn text={c.x.cue[0]} label={false} />
        </div>
        <AnimatePresence>
          {picked && (
            <motion.div className={`msg out ${picked.kind === 'right' ? '' : 'out-ko'}`} initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
              {picked.text}
              <span className="msg-status">{picked.kind === 'right' ? 'Read' : 'Delivered'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!picked && <p className="ask">Elige tu respuesta</p>}
      <div className="replies">
        {c.options.map((o) => (
          <button key={o.value} className={`reply ${stateOf(o, picked)} ${hidden.has(o.value) ? 'gone' : ''}`} disabled={!!picked || hidden.has(o.value)} onClick={() => onPick(o)}>
            {o.text}
          </button>
        ))}
      </div>
    </>
  );
}

/* 5 ─ Context detective */
export function DetectiveView(p: ModeProps) {
  const pk = PACK_BY_ID[p.c.x.pack];
  return (
    <>
      <div className="case">
        <div className="case-head">
          <span>Case file · {p.c.x.id.toUpperCase()}</span>
          <span>{pk.title}</span>
        </div>
        <div className="case-row">
          <span className="scene-label">Situación</span>
          <p>{p.c.x.scene}</p>
        </div>
        <div className="case-row">
          <span className="scene-label">La prueba</span>
          <p className="case-quote">
            <span>“{plain(lineOf(p.c.x))}”</span> <SpeakBtn text={plain(lineOf(p.c.x))} label={false} />
          </p>
        </div>
      </div>
      <p className="ask">¿Qué está pasando realmente?</p>
      <OptionList {...p} variant="hypo" />
    </>
  );
}

/* 6 ─ Complete the conversation */
export function CompleteView(p: ModeProps) {
  const { c, picked, hidden, onPick } = p;
  const { before, chunk, after } = splitChunk(lineOf(c.x));
  const shown = picked ? (picked.kind === 'right' ? picked.text : chunk) : null;
  return (
    <>
      <div className="transcript">
        <div className="line">
          <span className="who">Them</span>
          <p>{c.x.cue[0]}</p>
        </div>
        <div className="line you">
          <span className="who">You</span>
          <p>
            {before}
            <span className={`slot ${picked ? (picked.kind === 'right' ? 'ok' : 'ko') : ''}`}>{shown ?? '   '}</span>
            {after}
          </p>
        </div>
      </div>
      {picked && picked.kind !== 'right' && (
        <p className="slot-note">
          Pusiste <s>{picked.text}</s>
        </p>
      )}
      <p className="ask">Elige la pieza exacta</p>
      <div className="pieces">
        {c.options.map((o) => (
          <button key={o.value} className={`piece ${stateOf(o, picked)} ${hidden.has(o.value) ? 'gone' : ''}`} disabled={!!picked || hidden.has(o.value)} onClick={() => onPick(o)}>
            {o.text}
          </button>
        ))}
      </div>
    </>
  );
}

/* 7 ─ Phrase battle */
export function BattleView(p: ModeProps) {
  const { c, picked, onPick } = p;
  return (
    <>
      <div className="scene">
        <span className="scene-label">Situación</span>
        <p>{c.x.battle[0]}</p>
      </div>
      <p className="ask">¿Cuál encaja mejor?</p>
      <div className="duel">
        {c.options.map((o, i) => (
          <motion.button
            key={o.value}
            className={`fighter ${stateOf(o, picked)}`}
            disabled={!!picked}
            onClick={() => onPick(o)}
            initial={{ opacity: 0, x: i ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.08 }}
          >
            <span className="fighter-key">{LETTERS[i]}</span>
            <span className="fighter-text">“{o.text}”</span>
          </motion.button>
        ))}
        <span className="vs">vs</span>
      </div>
    </>
  );
}

export function ModeView(p: ModeProps) {
  useEffect(() => {
    if (p.c.mode === 'sarcasm' || p.c.mode === 'reply') {
      const t = setTimeout(() => speak(p.c.mode === 'reply' ? p.c.x.cue[0] : plain(lineOf(p.c.x))), 350);
      return () => clearTimeout(t);
    }
  }, [p.c]);
  switch (p.c.mode) {
    case 'meaning':
      return <MeaningView {...p} />;
    case 'sarcasm':
      return <SarcasmView {...p} />;
    case 'natural':
      return <NaturalView {...p} />;
    case 'reply':
      return <ReplyView {...p} />;
    case 'detective':
      return <DetectiveView {...p} />;
    case 'complete':
      return <CompleteView {...p} />;
    case 'battle':
      return <BattleView {...p} />;
  }
}

export { Icon };
