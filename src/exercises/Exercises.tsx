import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Npc, Pip } from '../art/Art';
import { speak } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { CHARACTERS } from '../data/meta';
import type { Exercise } from '../engine/exercises';

interface Props {
  ex: Exercise;
  locked: boolean;
  hidden: Set<string>;
  verdict: null | boolean;
  onChange: (v: string | null) => void;
}

export function SpeakBtn({ text, small }: { text: string; small?: boolean }) {
  const [slow, setSlow] = useState(false);
  return (
    <button
      className={`speak ${small ? 'speak-sm' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, { force: true, slow });
        setSlow(!slow);
      }}
      aria-label="Escuchar en inglés"
      title={slow ? 'Escuchar despacio' : 'Escuchar'}
    >
      {slow ? '🐢' : '🔊'}
    </button>
  );
}

function Prompt({ ex, label }: { ex: Exercise; label: string }) {
  const speaker = ex.speaker && ex.type === 'dialogue' ? ex.speaker : null;
  return (
    <div className={`prompt ${speaker ? 'prompt-npc' : ''}`}>
      <div className="prompt-who">{speaker ? <Npc id={speaker} size={86} /> : <Pip size={58} />}</div>
      <div className="bubble">
        {speaker && <small className="bubble-name" style={{ color: CHARACTERS[speaker]?.color }}>{CHARACTERS[speaker]?.name}</small>}
        <div className="bubble-en">
          <span>{ex.phrase.en}</span>
          <SpeakBtn text={ex.phrase.en} small />
        </div>
      </div>
      <p className="prompt-label">{label}</p>
    </div>
  );
}

function Options({ options, value, setValue, locked, hidden, answer, verdict }: { options: string[]; value: string | null; setValue: (v: string) => void; locked: boolean; hidden: Set<string>; answer: string; verdict: null | boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!locked && n >= 1 && n <= options.length && !hidden.has(options[n - 1])) {
        sfx.tap();
        setValue(options[n - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, locked, hidden, setValue]);

  return (
    <div className="options">
      {options.map((o, i) => {
        const isSel = value === o;
        const state = locked ? (o === answer ? 'right' : isSel && verdict === false ? 'wrong' : 'dim') : isSel ? 'sel' : '';
        return (
          <motion.button
            key={o}
            className={`option ${state} ${hidden.has(o) ? 'gone' : ''}`}
            disabled={locked || hidden.has(o)}
            onClick={() => {
              sfx.tap();
              setValue(o);
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: hidden.has(o) ? 0.25 : 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="option-key">{i + 1}</span>
            <span>{o}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function ChoiceEx({ ex, locked, hidden, verdict, onChange }: Props) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => onChange(value), [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Prompt ex={ex} label={ex.type === 'dialogue' ? `¿Qué te ha dicho ${CHARACTERS[ex.speaker ?? 'pip']?.name}?` : 'Elige la traducción correcta'} />
      <Options options={ex.options!} value={value} setValue={setValue} locked={locked} hidden={hidden} answer={ex.answer} verdict={verdict} />
    </>
  );
}

export function FillEx({ ex, locked, hidden, verdict, onChange }: Props) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => onChange(value), [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Prompt ex={ex} label="Completa el hechizo" />
      <div className={`fill-sentence ${locked ? (verdict ? 'ok' : 'ko') : ''}`}>
        {ex.blank!.before}
        <span className={`fill-slot ${value ? 'filled' : ''}`}>{locked && !verdict ? ex.answer : value ?? ' '}</span>
        {ex.blank!.after}
      </div>
      <div className="chips">
        {ex.options!.map((o, i) => (
          <motion.button
            key={o}
            className={`chip-word ${value === o ? 'sel' : ''} ${hidden.has(o) ? 'gone' : ''} ${locked && o === ex.answer ? 'right' : ''}`}
            disabled={locked || hidden.has(o)}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: hidden.has(o) ? 0.25 : 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 18 }}
            onClick={() => {
              sfx.tap();
              setValue(value === o ? null : o);
            }}
          >
            {o}
          </motion.button>
        ))}
      </div>
    </>
  );
}

export function BuildEx({ ex, locked, verdict, onChange }: Props) {
  // Each token gets a stable index so duplicates ("la ... la") work.
  const [picked, setPicked] = useState<number[]>([]);
  const tokens = ex.tokens!;
  useEffect(() => onChange(picked.length ? picked.map((i) => tokens[i]).join(' ') : null), [picked]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Prompt ex={ex} label="Forja la frase en español" />
      <LayoutGroup>
        <div className={`build-line ${locked ? (verdict ? 'ok' : 'ko') : ''}`}>
          <AnimatePresence>
            {picked.map((i) => (
              <motion.button
                layoutId={`tok-${ex.uid}-${i}`}
                key={i}
                className="token"
                disabled={locked}
                onClick={() => {
                  sfx.tap();
                  setPicked(picked.filter((x) => x !== i));
                }}
              >
                {tokens[i]}
              </motion.button>
            ))}
          </AnimatePresence>
          {!picked.length && <span className="build-hint">Toca las palabras en orden…</span>}
        </div>
        <div className="bank">
          {tokens.map((t, i) =>
            picked.includes(i) ? (
              <span key={i} className="token ghost">
                {t}
              </span>
            ) : (
              <motion.button
                layoutId={`tok-${ex.uid}-${i}`}
                key={i}
                className="token"
                disabled={locked}
                onClick={() => {
                  sfx.tap();
                  setPicked([...picked, i]);
                }}
              >
                {t}
              </motion.button>
            ),
          )}
        </div>
      </LayoutGroup>
    </>
  );
}

export function ExerciseView(props: Props) {
  const { ex } = props;
  useEffect(() => {
    if (ex.type === 'dialogue') {
      const t = setTimeout(() => speak(ex.phrase.en), 350);
      return () => clearTimeout(t);
    }
  }, [ex]);
  if (ex.type === 'build') return <BuildEx {...props} />;
  if (ex.type === 'fill') return <FillEx {...props} />;
  return <ChoiceEx {...props} />;
}
