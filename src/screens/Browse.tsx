import { motion } from 'framer-motion';
import { Poster } from '../components/Poster';
import { Btn, Dots, Icon, Ring, Sheet } from '../components/ui';
import { PACKS, PACK_BY_ID, plain } from '../data/content';
import { IN_RUN_MODES, MODES, MODE_BY_ID } from '../data/meta';
import { dueIds } from '../engine/srs';
import { packMastery, playerLevel, useGame, type RunMode } from '../store/game';

/* ───────────── Library ───────────── */

export function Library() {
  const { cards, xp, openPackSheet } = useGame();
  const level = playerLevel(xp);
  const open = PACKS.filter((p) => p.unlock <= level).length;
  return (
    <div className="screen library">
      <div className="eyebrow">Colecciones · {open} de {PACKS.length} abiertas</div>
      <h1 className="display">Pick your drama.</h1>
      <p className="muted lead">Cada colección es una temporada corta: cinco expresiones de B1 a C1, jugadas en todos los modos.</p>
      <div className="poster-grid">
        {PACKS.map((p, i) => {
          const locked = p.unlock > level;
          return (
            <motion.button key={p.id} className="poster-btn" onClick={() => openPackSheet(p.id)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <Poster pack={p} locked={locked} mastery={packMastery(cards, p.id)} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function PackSheet() {
  const s = useGame();
  const p = s.openPack ? PACK_BY_ID[s.openPack] : null;
  const level = playerLevel(s.xp);
  return (
    <Sheet open={!!p} onClose={() => s.openPackSheet(null)} className="pack-sheet">
      {p && (
        <>
          <Poster pack={p} locked={p.unlock > level} />
          <p className="pack-blurb">{p.blurb}</p>
          <div className="pack-stats">
            <Ring value={packMastery(s.cards, p.id)} size={52} tone="olive">
              <small className="mono">{Math.round(packMastery(s.cards, p.id) * 100)}%</small>
            </Ring>
            <div>
              <b>{s.packs[p.id]?.plays ?? 0}</b>
              <small>episodios jugados</small>
            </div>
            <div>
              <b>{s.packs[p.id]?.best ?? 0}%</b>
              <small>mejor precisión</small>
            </div>
          </div>
          {p.unlock > level ? (
            <p className="locked-note">
              <Icon name="lock" size={14} /> Se abre en el nivel {p.unlock}. Te faltan {p.unlock - level}. Mientras, alguna de sus frases puede salir como sorpresa en la sesión de hoy.
            </p>
          ) : (
            <>
              <Btn wide onClick={() => s.start({ kind: 'episode', packId: p.id })}>
                Jugar episodio · ~4 min <Icon name="play" size={14} fill />
              </Btn>
              <div className="eyebrow">O practica un modo con esta colección</div>
              <div className="mode-chips">
                {IN_RUN_MODES.map((m) => (
                  <button key={m} className="mode-chip" onClick={() => s.start({ kind: 'practice', mode: m as RunMode, packId: p.id })}>
                    <span>{MODE_BY_ID[m].glyph}</span> {MODE_BY_ID[m].es}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="eyebrow">Expresiones</div>
          <ul className="xlist">
            {p.expressions.map((x) => {
              const c = s.cards[x.id];
              return (
                <li key={x.id} className={c ? '' : 'undiscovered'}>
                  <button onClick={() => c && s.openExpression(x.id)} disabled={!c}>
                    <span className="xlist-en">{c ? plain(x.en) : '· · · · · · ·'}</span>
                    <span className="xlist-es">{c ? x.es : 'Sin descubrir. Juega para revelarla.'}</span>
                    <span className="xlist-meta">
                      <span className={`lvl lvl-${x.level}`}>{x.level}</span>
                      {c && <Dots value={c.box} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}

/* ───────────── Games ───────────── */

export function Games() {
  const s = useGame();
  const due = dueIds(s.cards, Date.now()).length;
  return (
    <div className="screen games">
      <div className="eyebrow">Juegos · 9 modos</div>
      <h1 className="display">Same phrases. Nine ways to get them wrong.</h1>
      <p className="muted lead">Cada modo entrena una habilidad distinta. Las expresiones salen de tus colecciones abiertas.</p>
      <div className="feature-row">
        <button className="feature" onClick={() => s.start({ kind: 'quickfire' })}>
          <span className="feature-glyph">⚡︎</span>
          <b>Quick Fire</b>
          <small>60 s · sí o no</small>
          <span className="feature-stat">Récord {s.stats.qfBest}</span>
        </button>
        <button className="feature" onClick={() => s.start({ kind: 'memory' })}>
          <span className="feature-glyph">◐</span>
          <b>Memory</b>
          <small>Repaso espaciado</small>
          <span className="feature-stat">{due ? `${due} pendientes` : 'Al día'}</span>
        </button>
      </div>
      <ul className="mode-list">
        {MODES.filter((m) => m.id !== 'quickfire' && m.id !== 'memory').map((m, i) => {
          const st = s.byMode[m.id];
          return (
            <motion.li key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <button onClick={() => s.start({ kind: 'practice', mode: m.id as RunMode })}>
                <span className="mode-glyph">{m.glyph}</span>
                <span className="mode-text">
                  <b>{m.title}</b>
                  <small>{m.desc}</small>
                </span>
                <span className="mode-acc">{st?.a ? `${Math.round((st.c / st.a) * 100)}%` : 'nuevo'}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
