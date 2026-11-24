import { AnimatePresence, motion } from 'framer-motion';
import { play, replay, stop, pause, resume, toggle, keyFor, useAudio, type Clip } from '../audio/voice';
import type { Expression } from '../data/types';
import type { Tone } from '../services/api';
import { Icon } from './ui';

/** Voice delivery for an expression, from its tone in the scene. */
export function toneFor(x: Pick<Expression, 'intent' | 'tags'>): Tone {
  switch (x.intent) {
    case 'sarcastic':
      return 'sarcastic';
    case 'passive-aggressive':
      return 'passive_aggressive';
    case 'annoyed':
      return 'frustrated';
    case 'joking':
      return 'amused';
    case 'flirty':
      return 'flirtatious';
    case 'evasive':
      return 'evasive';
    default:
      return x.tags.includes('work') ? 'professional' : 'casual';
  }
}

function Spinner() {
  return <span className="spin" aria-hidden />;
}

/**
 * Speaker control: main button plays / pauses / resumes; the 0.7× button plays a slower take.
 * Every press calls the real TTS endpoint (or the cache) and shows its state.
 */
export function Speak({ clips, label, slowButton = true, size = 'md' }: { clips: Clip[]; label?: string; slowButton?: boolean; size?: 'sm' | 'md' }) {
  const { key, status } = useAudio();
  const normal = clips.map((c) => ({ ...c, slow: false }));
  const slow = clips.map((c) => ({ ...c, slow: true }));
  const kN = keyFor(normal);
  const kS = keyFor(slow);
  const stateN = key === kN ? status : 'idle';
  const stateS = key === kS ? status : 'idle';
  const icon = (st: string) => (st === 'loading' ? <Spinner /> : st === 'playing' ? <Icon name="pause" size={16} /> : <Icon name="volume" size={16} />);
  const aria = (st: string, what: string) => (st === 'playing' ? `Pausar ${what}` : st === 'paused' ? `Reanudar ${what}` : st === 'loading' ? `Cargando ${what}` : `Escuchar ${what}`);
  return (
    <span className={`speak-group speak-${size}`} onClick={(e) => e.stopPropagation()}>
      <button className={`speak ${stateN !== 'idle' ? 'speak-' + stateN : ''}`} onClick={() => toggle(normal, label)} aria-label={aria(stateN, 'en inglés')} title="Escuchar">
        {icon(stateN)}
      </button>
      {slowButton && (
        <button className={`speak speak-slow ${stateS !== 'idle' ? 'speak-' + stateS : ''}`} onClick={() => toggle(slow, label)} aria-label={aria(stateS, 'despacio')} title="Escuchar despacio">
          {stateS === 'loading' ? <Spinner /> : stateS === 'playing' ? <Icon name="pause" size={14} /> : <span>0.7×</span>}
        </button>
      )}
    </span>
  );
}

/** Global player strip: what is playing, its source, pause/resume, replay and errors. */
export function AudioBar() {
  const s = useAudio();
  const visible = s.status !== 'idle';
  return (
    <div className="audiobar-wrap" aria-live="polite">
      <AnimatePresence>
        {visible && (
          <motion.div className={`audiobar ${s.status === 'error' ? 'is-error' : ''}`} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
            <div className="audiobar-main">
              {s.status === 'error' ? (
                <>
                  <b>No se pudo reproducir el audio</b>
                  <small>{s.error}</small>
                </>
              ) : (
                <>
                  <b>
                    {s.status === 'loading' ? 'Generando voz…' : s.status === 'paused' ? 'En pausa' : 'Reproduciendo'}
                    {s.total > 1 ? ` · ${s.index + 1}/${s.total}` : ''}
                  </b>
                  <small>
                    <span className={`src ${s.source === 'browser' ? 'src-browser' : ''}`}>{s.source === 'browser' ? 'Voz del navegador' : 'Voz IA'}</span> “{s.label}”
                  </small>
                  {s.source === 'browser' && s.fallbackReason && <small className="audiobar-why">La voz IA no está disponible: {s.fallbackReason}</small>}
                </>
              )}
            </div>
            <div className="audiobar-actions">
              {s.status === 'loading' && <Spinner />}
              {s.status === 'playing' && (
                <button onClick={pause} aria-label="Pausar">
                  <Icon name="pause" size={18} />
                </button>
              )}
              {s.status === 'paused' && (
                <button onClick={resume} aria-label="Reanudar">
                  <Icon name="play" size={16} fill />
                </button>
              )}
              {(s.status === 'playing' || s.status === 'paused' || s.status === 'error') && (
                <button onClick={() => replay()} aria-label={s.status === 'error' ? 'Reintentar' : 'Repetir'}>
                  <Icon name="refresh" size={17} />
                </button>
              )}
              <button onClick={stop} aria-label="Cerrar">
                <Icon name="x" size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { play };
