import { useMemo, useState } from 'react';
import { Bar, Btn, Dots, Icon, Ring, Sheet } from '../components/ui';
import { ALL, ALL_LIST, PACK_BY_ID, plain } from '../data/content';
import { ACHIEVEMENTS, MODES, titleFor } from '../data/meta';
import { dayKey } from '../engine/date';
import { levelFromXp } from '../engine/progression';
import { masteredCount } from '../engine/srs';
import { useServices } from '../services/api';
import { useGame } from '../store/game';
import { weekDays } from './Today';

/* ───────────── Phrasebook ───────────── */

type Filter = 'all' | 'due' | 'fav' | 'mastered';

export function Phrases() {
  const { cards, openExpression, start, go } = useGame();
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filter>('all');
  const now = Date.now();
  const list = useMemo(
    () =>
      Object.entries(cards)
        .filter(([id]) => ALL[id])
        .filter(([, c]) => (f === 'due' ? c.due <= now : f === 'fav' ? c.fav : f === 'mastered' ? c.box >= 5 : true))
        .filter(([id]) => {
          if (!q.trim()) return true;
          const x = ALL[id];
          const t = q.toLowerCase();
          return plain(x.en).toLowerCase().includes(t) || x.es.toLowerCase().includes(t);
        })
        .sort((a, b) => b[1].first - a[1].first),
    [cards, q, f, now],
  );
  const total = Object.keys(cards).length;
  const due = Object.values(cards).filter((c) => c.due <= now).length;

  return (
    <div className="screen phrases">
      <div className="eyebrow">
        Tu colección · {total} de {ALL_LIST.length}
      </div>
      <h1 className="display">Phrasebook</h1>
      <div className="search">
        <Icon name="search" size={17} />
        <input id="phrase-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en inglés o en español" />
      </div>
      <div className="filters">
        {(
          [
            ['all', 'Todas'],
            ['due', `Por repasar · ${due}`],
            ['fav', 'Favoritas'],
            ['mastered', 'Dominadas'],
          ] as [Filter, string][]
        ).map(([id, label]) => (
          <button key={id} className={`filter ${f === id ? 'on' : ''}`} onClick={() => setF(id)}>
            {label}
          </button>
        ))}
      </div>
      {f === 'due' && due > 0 && (
        <Btn wide variant="secondary" onClick={() => start({ kind: 'memory' })}>
          Repasar ahora en Memory
        </Btn>
      )}
      {list.length === 0 ? (
        <div className="empty">
          <p className="serif-lg">{total === 0 ? 'Nothing here yet.' : 'No matches.'}</p>
          <p className="muted">{total === 0 ? 'Cada expresión que descubras jugando se guarda aquí con su ficha completa.' : 'Prueba con otro filtro o búsqueda.'}</p>
          {total === 0 && <Btn onClick={() => go('today')}>Empezar la sesión de hoy</Btn>}
        </div>
      ) : (
        <ul className="xlist xlist-big">
          {list.map(([id, c]) => {
            const x = ALL[id];
            return (
              <li key={id}>
                <button onClick={() => openExpression(id)}>
                  <span className="xlist-en">
                    {c.fav && <Icon name="bookmark" size={13} fill className="fav-mark" />}
                    {plain(x.en)}
                  </span>
                  <span className="xlist-es">{x.es}</span>
                  <span className="xlist-meta">
                    <span className={`lvl lvl-${x.level}`}>{x.level}</span>
                    <small>{PACK_BY_ID[x.pack].title}</small>
                    <Dots value={c.box} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ───────────── Profile ───────────── */

export function Profile() {
  const s = useGame();
  const [confirm, setConfirm] = useState(false);
  const { level, into, need } = levelFromXp(s.xp);
  const acc = s.stats.answered ? Math.round((s.stats.correct / s.stats.answered) * 100) : 0;
  const mastered = masteredCount(s.cards);
  const days = weekDays();
  const maxXp = Math.max(40, ...days.map((d) => s.activity[d] ?? 0));
  const byLevel = (['B1', 'B2', 'C1'] as const).map((l) => {
    const all = ALL_LIST.filter((x) => x.level === l);
    const seen = all.filter((x) => s.cards[x.id]).length;
    const done = all.filter((x) => (s.cards[x.id]?.box ?? 0) >= 3).length;
    return { l, total: all.length, seen, done };
  });

  return (
    <div className="screen profile">
      <header className="profile-head">
        <Ring value={into / need} size={76} stroke={3} tone="accent">
          <b className="serif-md">{level}</b>
        </Ring>
        <div>
          <h1 className="display-sm">{s.name}</h1>
          <p className="muted">
            {titleFor(level)} · {need - into} XP para {titleFor(level + 1)}
          </p>
        </div>
      </header>

      <div className="kpis kpis-3">
        <div className="kpi">
          <b>{s.streak}</b>
          <small>racha (máx. {s.bestStreak})</small>
        </div>
        <div className="kpi">
          <b>{acc}%</b>
          <small>precisión total</small>
        </div>
        <div className="kpi">
          <b>{Object.keys(s.cards).length}</b>
          <small>expresiones</small>
        </div>
        <div className="kpi">
          <b>{mastered}</b>
          <small>dominadas</small>
        </div>
        <div className="kpi">
          <b>{s.stats.sessions}</b>
          <small>sesiones</small>
        </div>
        <div className="kpi">
          <b>{s.freezes}</b>
          <small>escudos de racha</small>
        </div>
      </div>

      <section className="block">
        <h3 className="block-title">Últimos 7 días</h3>
        <div className="week week-lg">
          {days.map((d) => {
            const v = s.activity[d] ?? 0;
            return (
              <div key={d} className={`wday ${d === dayKey() ? 'is-today' : ''}`}>
                <small className="mono">{v || ''}</small>
                <div className="wbar">
                  <i style={{ height: `${(v / maxXp) * 100}%` }} />
                </div>
                <small>{new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' })}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="block">
        <h3 className="block-title">Por nivel CEFR</h3>
        <ul className="bars">
          {byLevel.map((b) => (
            <li key={b.l}>
              <span className={`lvl lvl-${b.l}`}>{b.l}</span>
              <Bar value={b.done} max={b.total} tone="olive" />
              <small className="mono">
                {b.done}/{b.total}
              </small>
            </li>
          ))}
        </ul>
        <p className="note">Una expresión cuenta como asentada a partir de 3 de 5 en dominio.</p>
      </section>

      <section className="block">
        <h3 className="block-title">Por modo</h3>
        <ul className="bars">
          {MODES.filter((m) => m.id !== 'memory').map((m) => {
            const st = s.byMode[m.id];
            const pct = st?.a ? st.c / st.a : 0;
            return (
              <li key={m.id}>
                <span className="bars-label">{m.es}</span>
                <Bar value={pct * 100} max={100} tone={pct >= 0.8 ? 'olive' : 'accent'} />
                <small className="mono">{st?.a ? `${Math.round(pct * 100)}%` : '—'}</small>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="block">
        <h3 className="block-title">
          Logros <span className="muted">{Object.keys(s.achievements).length}/{ACHIEVEMENTS.length}</span>
        </h3>
        <ul className="achs">
          {ACHIEVEMENTS.map((a) => {
            const got = !!s.achievements[a.id];
            return (
              <li key={a.id} className={got ? 'got' : ''}>
                <span className="ach-mark">{got ? <Icon name="sparkle" size={14} /> : <Icon name="lock" size={13} />}</span>
                <div>
                  <b>{a.name}</b>
                  <small>{a.desc}</small>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="block">
        <h3 className="block-title">Ajustes</h3>
        <div className="settings">
          <label className="toggle" htmlFor="set-sound">
            <span>Sonidos</span>
            <input id="set-sound" type="checkbox" checked={s.settings.sound} onChange={() => s.toggleSetting('sound')} />
            <i />
          </label>
          <label className="toggle" htmlFor="set-voice">
            <span>Reproducir la frase en inglés al responder</span>
            <input id="set-voice" type="checkbox" checked={s.settings.voice} onChange={() => s.toggleSetting('voice')} />
            <i />
          </label>
          <label className="toggle" htmlFor="set-fallback">
            <span>Si la voz IA falla, usar la voz del dispositivo</span>
            <input id="set-fallback" type="checkbox" checked={s.settings.browserVoiceFallback} onChange={() => s.toggleSetting('browserVoiceFallback')} />
            <i />
          </label>
          <ServiceStatus />
          <button className="danger-link" onClick={() => setConfirm(true)}>
            Borrar todo el progreso
          </button>
        </div>
      </section>

      <Sheet open={confirm} onClose={() => setConfirm(false)}>
        <p className="serif-lg">Start over?</p>
        <p className="muted">Se borran tu colección, tu nivel, tu racha y tus logros. No se puede deshacer.</p>
        <div className="row-actions">
          <Btn variant="ghost" onClick={() => setConfirm(false)}>
            Cancelar
          </Btn>
          <Btn
            onClick={() => {
              s.reset();
              setConfirm(false);
            }}
          >
            Borrar
          </Btn>
        </div>
      </Sheet>
    </div>
  );
}

function ServiceStatus() {
  const { status, error, loaded } = useServices();
  if (!loaded) return null;
  const rows: [string, { ready: boolean; missing: string | null } | undefined, string][] = [
    ['Traductor IA', status?.translate, status?.translate.provider === 'openai' ? 'OpenAI' : 'Claude'],
    ['Voz IA en inglés', status?.tts, status?.tts.model ?? ''],
    ['Reconocimiento de voz', status?.stt, status?.stt.model ?? ''],
  ];
  return (
    <div className="services">
      <div className="label">Servicios de IA</div>
      {!status && <p className="note">{error}</p>}
      {status &&
        rows.map(([name, st, detail]) => (
          <p key={name} className={`svc ${st?.ready ? 'ok' : 'ko'}`}>
            <i />
            <span>{name}</span>
            <small>{st?.ready ? `activo · ${detail}` : `sin configurar · falta ${st?.missing}`}</small>
          </p>
        ))}
    </div>
  );
}
