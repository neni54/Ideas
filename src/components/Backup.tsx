// Progress backup: the save lives only on this device (localStorage). This lets players move it
// to another device, from Safari to the installed iPhone app, or keep a copy before deleting the app.
import { useRef, useState } from 'react';
import { useGame } from '../store/game';
import { IN_ARTIFACT } from '../pwa/register';
import { Btn, Icon } from './ui';

const SAVE_KEY = 'subtext-save-v1'; // the store's persist key (see store/game.ts)

function readSave(): string | null {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

export function Backup() {
  return IN_ARTIFACT ? null : <BackupInner />;
}

function BackupInner() {
  const name = useGame((s) => s.name);
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const exportSave = async () => {
    const raw = readSave();
    if (!raw) return setMsg({ ok: false, text: 'Todavía no hay progreso guardado.' });
    const date = new Date().toISOString().slice(0, 10);
    const file = new File([JSON.stringify({ app: 'SIDEYE', savedAt: new Date().toISOString(), save: JSON.parse(raw) })], `sideye-progreso-${date}.json`, { type: 'application/json' });
    // Phones: the share sheet (save to Files, AirDrop, WhatsApp…). Elsewhere: a normal download.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Progreso de SIDEYE' });
        return setMsg({ ok: true, text: 'Copia lista. Guárdala en Archivos o envíatela.' });
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    setMsg({ ok: true, text: 'Copia descargada.' });
  };

  const importSave = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const save = data?.app === 'SIDEYE' ? data.save : data;
      const st = save?.state;
      if (!st || typeof st.xp !== 'number' || typeof st.cards !== 'object') throw new Error('bad');
      if (!window.confirm(`¿Restaurar el progreso de "${st.name || 'jugador'}" (${st.xp} XP)? Sustituye el progreso de este dispositivo${name ? ` (${name})` : ''}.`)) return;
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      location.reload();
    } catch {
      setMsg({ ok: false, text: 'Ese archivo no es una copia de SIDEYE.' });
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="backup">
      <div className="label">Copia de seguridad</div>
      <p className="note">Tu progreso se guarda solo en este dispositivo. Haz una copia para pasarlo a otro móvil o de Safari a la app instalada.</p>
      <div className="row-actions">
        <Btn variant="secondary" onClick={exportSave}>
          <Icon name="download" size={16} /> Guardar copia
        </Btn>
        <Btn variant="ghost" onClick={() => input.current?.click()}>
          Restaurar
        </Btn>
      </div>
      <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => importSave(e.target.files?.[0])} />
      {msg && <p className={`backup-msg ${msg.ok ? 'ok' : 'ko'}`}>{msg.text}</p>}
    </div>
  );
}
