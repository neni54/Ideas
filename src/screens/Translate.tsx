import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Speak } from '../components/Speak';
import { Btn, Icon } from '../components/ui';
import { ApiError, translateText, useServices, type Tone, type Translation } from '../services/api';
import { useGame } from '../store/game';

type Dir = 'auto' | 'en-es' | 'es-en';

const EXAMPLES = ["Oh, that's just what I needed today.", "Let's touch base after lunch.", "He's been ghosting me since Friday.", 'Ya te vale, tío.', 'No me comas la cabeza.'];

const REGISTER: Record<string, string> = {
  formal: 'formal',
  neutral: 'neutro',
  informal: 'informal',
  conversational: 'conversacional',
  professional: 'profesional',
  slang: 'slang',
  vulgar: 'vulgar',
};
const TONE_ES: Record<string, string> = {
  neutral: 'neutro',
  sincere: 'sincero',
  sarcastic: 'sarcástico',
  ironic: 'irónico',
  humorous: 'humor',
  'passive-aggressive': 'pasivo-agresivo',
  flirtatious: 'coqueto',
  annoyed: 'molesto',
  affectionate: 'cariñoso',
  enthusiastic: 'entusiasta',
  evasive: 'evasivo',
};
const KIND: Record<string, string> = { idiom: 'idiom', phrasal_verb: 'phrasal verb', slang: 'slang', collocation: 'colocación', joke: 'chiste', double_meaning: 'doble sentido', other: 'expresión' };

/** Voice delivery for translated English, from the tone the AI detected. */
export function voiceTone(t: string, register: string): Tone {
  if (t === 'sarcastic' || t === 'ironic') return 'sarcastic';
  if (t === 'passive-aggressive') return 'passive_aggressive';
  if (t === 'humorous') return 'amused';
  if (t === 'annoyed') return 'frustrated';
  if (t === 'flirtatious') return 'flirtatious';
  if (t === 'enthusiastic') return 'surprised';
  if (t === 'evasive') return 'evasive';
  if (register === 'professional' || register === 'formal') return 'professional';
  return 'casual';
}

export function Translate() {
  const { translatorDraft, translations, saveTranslation } = useGame();
  const services = useServices();
  const [text, setText] = useState(translatorDraft ?? '');
  const [dir, setDir] = useState<Dir>('auto');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<{ text: string; r: Translation } | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    services.load();
    if (translatorDraft) useGame.setState({ translatorDraft: null });
    return () => ctrl.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (input = text) => {
    const t = input.trim();
    if (!t || loading) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoading(true);
    setError(null);
    try {
      const r = await translateText(t, dir, context, c.signal);
      setResult({ text: t, r });
      saveTranslation({ at: Date.now(), text: t, direction: dir, context, result: r });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof ApiError ? e : new ApiError('unknown', 'Algo ha fallado al traducir. Inténtalo de nuevo.'));
    } finally {
      if (ctrl.current === c) setLoading(false);
    }
  };

  const st = services.status?.translate;
  const r = result?.r;
  const englishText = r ? (r.source_language === 'en' ? result!.text : r.translation) : '';
  const tone = r ? voiceTone(r.tone, r.register) : 'casual';

  return (
    <div className="screen translate">
      <div className="eyebrow">Traductor con IA · contexto, tono y matiz</div>
      <h1 className="display">Say what they mean.</h1>

      {services.loaded && (!st || !st.ready) && (
        <div className="notice">
          <Icon name="bulb" size={16} />
          <p>
            {st
              ? `El traductor no está configurado en el servidor: falta ${st.missing}. Añádela al archivo .env y reinicia el servidor.`
              : services.error ?? 'No se encuentra el servidor de IA.'}
          </p>
        </div>
      )}

      <div className="seg" role="radiogroup" aria-label="Dirección">
        {(
          [
            ['auto', 'Detectar'],
            ['en-es', 'Inglés → Español'],
            ['es-en', 'Español → Inglés'],
          ] as [Dir, string][]
        ).map(([id, label]) => (
          <button key={id} role="radio" aria-checked={dir === id} className={dir === id ? 'on' : ''} onClick={() => setDir(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="tbox">
        <textarea
          id="translate-input"
          value={text}
          maxLength={1000}
          rows={3}
          placeholder="Escribe o pega una frase en inglés o en español…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run();
          }}
        />
        <div className="tbox-foot">
          <button className="link-quiet" onClick={() => setShowContext(!showContext)}>
            {showContext ? 'Quitar contexto' : '+ Añadir contexto'}
          </button>
          <small className="mono">{text.length}/1000</small>
        </div>
        {showContext && (
          <input id="translate-context" className="tctx" value={context} maxLength={300} onChange={(e) => setContext(e.target.value)} placeholder="¿Quién lo dice y dónde? Ej.: mi jefe, en un correo" />
        )}
      </div>

      <Btn wide onClick={() => run()} disabled={!text.trim() || loading}>
        {loading ? (
          <>
            <span className="spin spin-dark" /> Leyendo entre líneas…
          </>
        ) : (
          <>
            Traducir <Icon name="arrow" size={16} />
          </>
        )}
      </Btn>

      {!result && !loading && (
        <div className="examples">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              className="example"
              onClick={() => {
                setText(e);
                run(e);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div className="terror" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert">
            <b>No se pudo traducir.</b>
            <p>{error.message}</p>
            <Btn variant="ghost" onClick={() => run()}>
              Reintentar
            </Btn>
          </motion.div>
        )}
      </AnimatePresence>

      {r && !loading && (
        <motion.section className="tresult" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="tresult-head">
            <span className="eyebrow">
              {r.source_language === 'en' ? 'Inglés → Español' : 'Español → Inglés'}
            </span>
            <span className="tchips">
              <span className="chip-tone">{TONE_ES[r.tone] ?? r.tone}</span>
              <span className="chip-tag">{REGISTER[r.register] ?? r.register}</span>
            </span>
          </div>
          <p className="tmain">{r.translation}</p>
          <div className="tlisten">
            <span>Escuchar en inglés</span>
            <Speak clips={[{ text: englishText, tone }]} label={englishText} />
          </div>
          <dl className="xcard-list">
            <div>
              <dt>Lo que quiere decir de verdad</dt>
              <dd>{r.real_meaning}</dd>
            </div>
            {r.literal_translation && (
              <div className="xcard-mistake">
                <dt>Traducción literal (lo que NO significa)</dt>
                <dd>{r.literal_translation}</dd>
              </div>
            )}
            {r.expressions.length > 0 && (
              <div>
                <dt>Expresiones</dt>
                <dd>
                  <ul className="texpr">
                    {r.expressions.map((x, i) => (
                      <li key={i}>
                        <b>{x.expression}</b> <span className="chip-tag">{KIND[x.kind] ?? x.kind}</span>
                        <span>{x.meaning}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {r.alternatives.length > 0 && (
              <div>
                <dt>Alternativas</dt>
                <dd>
                  <ul className="talts">
                    {r.alternatives.map((a, i) => (
                      <li key={i}>
                        <span className="talt-text">
                          {a.text}
                          {r.target_language === 'en' && <Speak clips={[{ text: a.text, tone }]} slowButton={false} size="sm" />}
                        </span>
                        <small>
                          {a.register} · {a.note}
                        </small>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {r.notes && (
              <div>
                <dt>Nota</dt>
                <dd>{r.notes}</dd>
              </div>
            )}
          </dl>
          <p className="note">Traducido por IA ({r.provider === 'openai' ? 'OpenAI' : 'Claude'}). Puede equivocarse con textos muy ambiguos: añade contexto si hace falta.</p>
        </motion.section>
      )}

      {translations.length > 0 && (
        <section className="block">
          <h3 className="block-title">Recientes</h3>
          <ul className="xlist">
            {translations.slice(0, 6).map((t) => (
              <li key={t.at}>
                <button
                  onClick={() => {
                    setText(t.text);
                    setDir(t.direction);
                    setResult({ text: t.text, r: t.result });
                    setError(null);
                  }}
                >
                  <span className="xlist-en">{t.text}</span>
                  <span className="xlist-es">{t.result.translation}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
