import { useMemo, useState } from 'react';
import { play } from '../audio/voice';
import { sfx } from '../audio/sfx';
import { ALL, PACK_BY_ID, lineOf, plain } from '../data/content';
import { INTENT_LABEL, TAG_LABEL } from '../data/meta';
import type { Expression } from '../data/types';
import { shuffle } from '../engine/date';
import { useGame } from '../store/game';
import { Pronounce } from './Pronounce';
import { Speak, toneFor } from './Speak';
import { Dots, Icon, Sheet } from './ui';

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
              {x.ex[0]} <Speak clips={[{ text: x.ex[0], tone: toneFor(x) }]} size="sm" />
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
      <div className="convo">
        <div className="label">La conversación</div>
        <p className="convo-line">
          <span className="who">Them</span> {x.cue[0]}
        </p>
        <p className="convo-line you">
          <span className="who">You</span> {plain(lineOf(x))}
        </p>
        <button
          className="btn btn-secondary btn-wide"
          onClick={() =>
            play(
              [
                { text: x.cue[0], tone: 'casual', voice: 'partner' },
                { text: plain(lineOf(x)), tone: toneFor(x) },
              ],
              'Conversación completa',
            )
          }
        >
          <Icon name="chat" size={16} /> Escuchar la conversación
        </button>
      </div>
      <Pronounce target={plain(lineOf(x))} tone={toneFor(x)} />
      {withChallenge && <MiniChallenge x={x} />}
    </div>
  );
}

/** Global expression sheet, opened from anywhere with openExpression(id). */
export function ExpressionSheet() {
  const { openX, openExpression, cards, toggleFav, savePhrase, openTranslator } = useGame();
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
            <Speak clips={[{ text: plain(x.en), tone: toneFor(x) }]} label={plain(x.en)} />
          </div>
          <ExpressionBody x={x} />
          <button className="link" onClick={() => openTranslator(plain(lineOf(x)))}>
            <Icon name="translate" size={15} /> Analizar con el traductor IA
          </button>
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
