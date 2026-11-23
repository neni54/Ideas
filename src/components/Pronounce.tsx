import { useEffect, useRef, useState } from 'react';
import { stop as stopVoice } from '../audio/voice';
import { ApiError, transcribeAudio, useServices } from '../services/api';
import { Speak } from './Speak';
import type { Tone } from '../services/api';
import { Icon } from './ui';
import { compare } from '../engine/pronunciation';

/* ───── Recorder ───── */

type Phase = 'idle' | 'asking' | 'recording' | 'analyzing' | 'done' | 'error';

const MAX_SECONDS = 12;

function pickMime() {
  const opts = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return opts.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(m)) ?? '';
}

export function Pronounce({ target, tone }: { target: string; tone: Tone }) {
  const services = useServices();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [heard, setHeard] = useState('');
  const [mine, setMine] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    services.load();
    return () => {
      rec.current?.state === 'recording' && rec.current.stop();
      if (timer.current) clearInterval(timer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const sttReady = services.status?.stt.ready;

  const start = async () => {
    setError(null);
    setHeard('');
    stopVoice();
    setPhase('asking');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      const name = (e as Error).name;
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'No hay permiso para usar el micrófono. Actívalo en los ajustes del navegador para este sitio.'
          : name === 'NotFoundError'
            ? 'No se ha encontrado ningún micrófono.'
            : 'No se pudo acceder al micrófono.',
      );
      setPhase('error');
      return;
    }
    const mime = pickMime();
    const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timer.current) clearInterval(timer.current);
      const blob = new Blob(chunks, { type: (r.mimeType || mime || 'audio/webm').split(';')[0] });
      setMine((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      if (blob.size < 2000) {
        setError('La grabación es demasiado corta. Mantén pulsado un poco más y di la frase completa.');
        setPhase('error');
        return;
      }
      setPhase('analyzing');
      try {
        const text = await transcribeAudio(blob);
        setHeard(text);
        setPhase('done');
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudo analizar la grabación.');
        setPhase('error');
      }
    };
    rec.current = r;
    r.start();
    setSecs(0);
    setPhase('recording');
    timer.current = window.setInterval(() => {
      setSecs((s) => {
        if (s + 1 >= MAX_SECONDS) r.state === 'recording' && r.stop();
        return s + 1;
      });
    }, 1000);
  };

  const finish = () => rec.current?.state === 'recording' && rec.current.stop();
  const result = phase === 'done' ? compare(target, heard) : null;

  return (
    <div className="pron">
      <div className="label">Practica la pronunciación</div>
      <p className="pron-target">“{target}”</p>
      <div className="pron-row">
        <Speak clips={[{ text: target, tone }]} />
        {!supported ? (
          <span className="pron-msg">Este navegador no permite grabar audio.</span>
        ) : services.loaded && !sttReady ? (
          <span className="pron-msg">
            El reconocimiento de voz no está activo{services.status?.stt.missing ? ` (falta ${services.status.stt.missing} en el servidor)` : ': esta versión no tiene servidor de IA'}.
          </span>
        ) : phase === 'recording' ? (
          <button className="rec rec-on" onClick={finish}>
            <Icon name="stop" size={15} fill /> Parar · {MAX_SECONDS - secs}s
          </button>
        ) : (
          <button className="rec" onClick={start} disabled={phase === 'asking' || phase === 'analyzing'}>
            <Icon name="mic" size={16} /> {phase === 'analyzing' ? 'Analizando…' : phase === 'asking' ? 'Permiso…' : phase === 'done' ? 'Repetir' : 'Grabarme'}
          </button>
        )}
      </div>
      {phase === 'error' && error && <p className="pron-error">{error}</p>}
      {result && (
        <div className="pron-result">
          <p className="pron-words">
            {result.target.map((t, i) => (
              <span key={i} className={t.ok ? 'w-ok' : 'w-miss'}>
                {t.w}{' '}
              </span>
            ))}
          </p>
          <p className="pron-heard">
            <small>El reconocimiento de voz entendió</small> “{heard || '(nada)'}”
          </p>
          <p className="pron-verdict">
            <b>{Math.round(result.score * 100)}% de las palabras reconocidas.</b>{' '}
            {result.score >= 0.9
              ? 'Se te entiende perfectamente.'
              : result.score >= 0.65
                ? 'Se te entiende. Repite las palabras marcadas, escuchándolas antes a 0.7×.'
                : 'Al reconocimiento le costó entenderte. Escucha la versión lenta y prueba frase a frase.'}
            {result.extra.length > 0 && ` Palabras de más: ${result.extra.join(', ')}.`}
          </p>
          {mine && <audio className="pron-mine" controls src={mine} />}
          <p className="note">Comparamos lo que entendió un sistema de reconocimiento de voz con la frase objetivo. Mide si se te entiende, no evalúa la fonética sonido por sonido.</p>
        </div>
      )}
    </div>
  );
}
