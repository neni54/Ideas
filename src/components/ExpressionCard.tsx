import { useMemo, useState } from 'react';
import { speak } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { ALL, PACK_BY_ID, lineOf, plain } from '../data/content';
import { INTENT_LABEL, TAG_LABEL } from '../data/meta';
import type { Expression } from '../data/types';
import { shuffle } from '../engine/date';
import { useGame } from '../store/game';
import { Dots, Icon, Sheet } from './ui';

export function SpeakBtn({ text, label = true }: { text: string; label?: boolean }) {
  const [slow, setSlow] = useState(false);
  return (
    <button
      className="speak"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, { force: true, slow });
        setSlow(!slow);
      }}
      aria-label={slow ? 'Escuchar despacio' : 'Escuchar'}
    >
      <Icon name="volume" size={17} />
      {label && <span>{slow ? '0.7×' : '1×'}</span>}
    </button>
  );
}

export function Highlight({ en }: { en: string }) {
  const parts = en.split(/(\[[^\]]+\])/);
  return (
    <>
      {parts.map((p, i) => (p.startsWith('[') ? <mark key={i}>{p.slice(1, -1)}</mark> : <span key={i}>{p}</span>))}
    </>
  );
}

function MiniChallenge({ x }: { x: Expression }) {
  const options = useMemo(() => shuffle([{ t: x.gist, ok: true }, { t: x.literal, ok: false }, { t: x.wrong[0], ok: false }]), [x]);
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="mini">
      <div className="label">Pruébalo</div>
      <p className="mini-scene">{x.scene}</p>
      <p className="mini-q">
        Alguien dice: <em>“{plain(lineOf(x))}”</em>. ¿Qué quiere decir?
      </p>
      <div className="mini-opts">
        {options.map((o, i) => (
          <button
            key={i}
            className={`mini-opt ${picked === null ? '' : o.ok ? 'right' : picked === i ? 'wrong' : 'dim'}`}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i);
              o.ok ? sfx.correct() : sfx.wrong();
            }}
          >
            {o.t}
          </button>
        ))}
      </div>
      {picked !== null && <p className="mini-after">{options[picked].ok ? 'Exacto. Ya es tuya.' : 'Casi. La clave está en el contexto: no lo traduzcas palabra por palabra.'}</p>}
    </div>
  );
}

export function ExpressionBody({ x, withChallenge = true }: { x: Expression; withChallenge?: boolean }) {
  return (
    <div className="xcard">
      <div className="xcard-chips">
        <span className={`lvl lvl-${x.level}`}>{x.level}</span>
        <span className="chip-tone">{INTENT_LABEL[x.intent]}</span>
        {x.tags.map((t) => (
          <span key={t} className="chip-tag">
            {TAG_LABEL[t]}
          </span>
        ))}
      </div>
      <dl className="xcard-list">
        <div>
          <dt>Cuándo se usa</dt>
          <dd>{x.context}</dd>
        </div>
        <div>
          <dt>Lo que significa de verdad</dt>
          <dd>{x.meaning}</dd>
        </div>
        <div className="xcard-mistake">
          <dt>Error típico</dt>
          <dd>{x.mistake}</dd>
        </div>
        <div>
          <dt>Otro ejemplo</dt>
          <dd>
            <span className="ex-en">
              {x.ex[0]} <SpeakBtn text={x.ex[0]} label={false} />
            </span>
            <span className="ex-es">{x.ex[1]}</span>
          </dd>
        </div>
        <div>
          <dt>Ojo con la parecida</dt>
          <dd>
            <span className="rival">“{x.battle[1]}”</span> {x.battle[2]}
          </dd>
        </div>
      </dl>
      {withChallenge && <MiniChallenge x={x} />}
    </div>
  );
}

/** Global expression sheet, opened from anywhere with openExpression(id). */
export function ExpressionSheet() {
  const { openX, openExpression, cards, toggleFav, savePhrase } = useGame();
  const x = openX ? ALL[openX] : null;
  const card = x ? cards[x.id] : undefined;
  return (
    <Sheet open={!!x} onClose={() => openExpression(null)} className="sheet-x-card">
      {x && (
        <>
          <div className="eyebrow">
            Vol. {String(PACK_BY_ID[x.pack].vol).padStart(2, '0')} · {PACK_BY_ID[x.pack].title}
          </div>
          <h2 className="xcard-en">
            <Highlight en={x.en} />
          </h2>
          <div className="xcard-es-row">
            <p className="xcard-es">{x.es}</p>
            <SpeakBtn text={plain(x.en)} />
          </div>
          <ExpressionBody x={x} />
          <div className="xcard-foot">
            {card ? (
              <>
                <div className="mastery">
                  <small>Dominio</small>
                  <Dots value={card.box} />
                </div>
                <button className={`fav ${card.fav ? 'on' : ''}`} onClick={() => toggleFav(x.id)} aria-pressed={!!card.fav}>
                  <Icon name="bookmark" size={18} fill={!!card.fav} /> {card.fav ? 'Favorita' : 'Marcar'}
                </button>
              </>
            ) : (
              <button className="btn btn-secondary btn-wide" onClick={() => savePhrase(x.id)}>
                Guardar en mi colección
              </button>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
