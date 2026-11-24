import { LevelTag } from '../components/LevelTag';
import { motion } from 'framer-motion';
import { LEVELS } from '../data/levels';
import { currentLevel, levelStats } from '../engine/levelProgress';
import { Poster } from '../components/Poster';
import { Btn, Dots, Icon, Ring, Sheet } from '../components/ui';
import { PACKS, PACK_BY_ID, plain } from '../data/content';
import { IN_RUN_MODES, MODES, MODE_BY_ID } from '../data/meta';
import { dueIds } from '../engine/srs';
import { packMastery, playerLevel, useGame, useGate, type RunMode } from '../store/game';
import { packHasNew } from '../engine/session';
import { TWIST_COLLECTIONS } from '../data/twists';

/* ───────────── Library ───────────── */

export function Library() {
  const { cards, openPackSheet } = useGame();
  const stats = levelStats(cards);
  const mine = currentLevel(cards).tier;
  return (
    <div className="screen library">
      <div className="eyebrow">Colecciones · {PACKS.length} · 5 niveles</div>
      <h1 className="display">Pick your drama.</h1>
      <p className="muted lead">Cinco niveles, de FIRST STEPS (A1) a THINK IN ENGLISH (C1). Empieza por el tuyo; puedes abrir cualquier otro cuando quieras.</p>
      {LEVELS.map((l) => {
        const st = stats.find((x) => x.tier === l.tier)!;
        const packs = PACKS.filter((p) => p.tier === l.tier);
        return (
          <section key={l.tier} className={`lib-level ${l.tier === mine ? 'mine' : ''}`}>
            <header className="lib-level-head">
              <span className="lib-level-n">{l.tier}</span>
              <div>
                <h2>
                  {l.name} <LevelTag tier={l.tier} />
                </h2>
                <p>{l.blurb}</p>
              </div>
              {l.tier === mine && <span className="lib-mine">Tu nivel</span>}
            </header>
            <div className="lib-level-bar" aria-label={`${st.seen} de ${st.total} frases vistas`}>
              <i style={{ width: `${(st.seen / Math.max(1, st.total)) * 100}%` }} />
              <small>
                {st.seen}/{st.total} frases
              </small>
            </div>
            <div className="poster-grid">
              {packs.map((p, i) => (
                <motion.button key={p.id} className="poster-btn" onClick={() => openPackSheet(p.id)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                  <Poster pack={p} locked={false} mastery={packMastery(cards, p.id)} />
                </motion.button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function PackSheet() {
  const s = useGame();
  const gate = useGate();
  const p = s.openPack ? PACK_BY_ID[s.openPack] : null;
  const knownInPack = p ? p.expressions.filter((x) => s.cards[x.id]).length : 0;
  const level = playerLevel(s.xp);
  return (
    <Sheet open={!!p} onClose={() => s.openPackSheet(null)} className="pack-sheet">
      {p && (
        <>
          <Poster pack={p} locked={false} />
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
          {(p.tier ?? 1) > currentLevel(s.cards).tier && (
            <p className="level-note">
              <LevelTag tier={p.tier ?? 1} full /> Más avanzado que tu nivel actual. Puedes jugarlo igualmente{p.unlock > level ? `; se recomienda a partir del nivel ${p.unlock} de experiencia` : ''}.
            </p>
          )}
          {(
            <>
              {!gate.canLearnNew && packHasNew(p.id, s.cards) && (
                <p className="locked-note">
                  <Icon name="lock" size={14} />
                  {gate.state === 'review-first'
                    ? 'Las expresiones nuevas de esta colección vuelven en cuanto termines el repaso de ayer (en Hoy).'
                    : 'Las expresiones nuevas de esta colección vuelven mañana. Hoy puedes repasar las que ya conoces.'}
                </p>
              )}
              {gate.canLearnNew || !packHasNew(p.id, s.cards) ? (
                <Btn wide onClick={() => s.start({ kind: 'episode', packId: p.id })}>
                  Jugar episodio · ~4 min <Icon name="play" size={14} fill />
                </Btn>
              ) : (
                <Btn wide variant="secondary" disabled={!knownInPack} onClick={() => s.start({ kind: 'episode', packId: p.id })}>
                  {knownInPack ? `Repasar las ${knownInPack} que ya conoces` : 'Aún no conoces ninguna de esta colección'}
                </Btn>
              )}
              <div className="eyebrow">O practica un modo con esta colección</div>
              <div className="mode-chips">
                {IN_RUN_MODES.map((m) => (
                  <button key={m} className="mode-chip" disabled={!gate.canLearnNew && !knownInPack} onClick={() => s.start({ kind: 'practice', mode: m as RunMode, packId: p.id })}>
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
                      <LevelTag item={x} />
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
  const gate = useGate();
  const due = dueIds(s.cards, Date.now()).length;
  return (
    <div className="screen games">
      <div className="eyebrow">Juegos · 11 modos</div>
      <h1 className="display">Same phrases. Eleven ways to get them wrong.</h1>
      <p className="muted lead">Cada modo entrena una habilidad distinta. Las expresiones salen de tus colecciones abiertas.</p>
      {!gate.canLearnNew && <p className="locked-note">Modo repaso: hoy los juegos usan solo expresiones que ya has visto. El contenido nuevo vuelve {gate.state === 'review-first' ? 'al terminar el repaso de ayer' : 'mañana'}.</p>}
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
      <section className="premium">
        <button className="premium-card twist-card" onClick={() => s.start({ kind: 'twist' })}>
          <span className="eyebrow">Nuevo · escenas</span>
          <b>The Unexpected Twist</b>
          <small>Escenas cortas, un diálogo y una última frase que no significa lo que dice.</small>
          <span className="feature-stat">{s.byMode.twist?.a ? `${Math.round((s.byMode.twist.c / s.byMode.twist.a) * 100)}% aciertos` : '36 escenas originales'}</span>
        </button>
        <div className="twist-cols">
          {TWIST_COLLECTIONS.map((c) => (
            <button key={c.id} className="twist-col" style={{ ['--p1' as string]: c.colors[0], ['--p2' as string]: c.colors[1] }} onClick={() => s.start({ kind: 'twist', collection: c.id })}>
              {c.title}
            </button>
          ))}
        </div>
        <button className="premium-card voice-card" onClick={() => s.start({ kind: 'voice' })}>
          <span className="eyebrow">Nuevo · audio</span>
          <b>Voice Acting</b>
          <small>La misma frase, dicha de otra forma, significa otra cosa. Escucha y decide.</small>
          <span className="feature-stat">{s.byMode.voice?.a ? `${Math.round((s.byMode.voice.c / s.byMode.voice.a) * 100)}% aciertos` : '12 frases · 36 interpretaciones'}</span>
        </button>
      </section>
      <ul className="mode-list">
        {MODES.filter((m) => !['quickfire', 'memory', 'twist', 'voice'].includes(m.id)).map((m, i) => {
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
