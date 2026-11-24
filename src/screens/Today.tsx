import { motion } from 'framer-motion';
import { Highlight } from '../components/ExpressionCard';
import { Logo } from '../components/Logo';
import { Poster } from '../components/Poster';
import { Bar, Btn, Icon } from '../components/ui';
import { PACKS, plain } from '../data/content';
import { titleFor } from '../data/meta';
import { greeting } from '../data/voice';
import { dayKey } from '../engine/date';
import { levelFromXp } from '../engine/progression';
import { phraseOfTheDay, weeklyPack } from '../engine/session';
import { dueIds } from '../engine/srs';
import { kindOf } from '../data/extra';
import { GOAL_PACKS, packMastery, useGame, useGate } from '../store/game';

export function weekDays() {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) out.push(dayKey(new Date(Date.now() - i * 86400000)));
  return out;
}

export function Today() {
  const s = useGame();
  const gate = useGate();
  const owed = { expression: 0, twist: 0, voice: 0 };
  for (const id of gate.pending) {
    const k = kindOf(id);
    if (k) owed[k]++;
  }
  const today = dayKey();
  const { level, into, need } = levelFromXp(s.xp);
  const potd = phraseOfTheDay(today);
  const weekly = weeklyPack(today, level);
  const due = dueIds(s.cards, Date.now()).length;
  const open = PACKS.filter((p) => p.unlock <= level);
  const goalPacks = s.goals.flatMap((g) => GOAL_PACKS[g]);
  const recommended =
    [...open].sort((a, b) => Number(goalPacks.includes(b.id)) - Number(goalPacks.includes(a.id)) || packMastery(s.cards, a.id) - packMastery(s.cards, b.id))[0] ?? open[0];
  const allClaimed = s.missions.list.every((m) => m.claimed);
  const days = weekDays();
  const weekXp = days.reduce((a, d) => a + (s.activity[d] ?? 0), 0);
  const maxXp = Math.max(40, ...days.map((d) => s.activity[d] ?? 0));
  const weekNew = Object.values(s.cards).filter((c) => c.first > Date.now() - 7 * 86400000).length;
  const dateLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="screen today">
      <div className="brandbar">
        <Logo size={24} />
        <button className={`streak-pill ${s.lastPlayDay === today ? 'lit' : ''}`} onClick={() => s.go('profile')} aria-label={`Racha de ${s.streak} días`}>
          <Icon name="flame" size={16} />
          <b>{s.streak}</b>
        </button>
      </div>
      <header className="today-head">
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <h1 className="display">{greeting(s.name)}</h1>
        </div>
      </header>

      <div className="level-strip">
        <span>
          Nivel {level} · <em>{titleFor(level)}</em>
        </span>
        <Bar value={into} max={need} tone="cream" />
        <small>{need - into} XP para {titleFor(level + 1)}</small>
      </div>

      <motion.section className={`daily ${gate.state !== 'open' ? 'review' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {gate.state === 'open' && (
          <>
            <div className="eyebrow">Lección {s.lessons + 1} · 5 minutos</div>
            <h2 className="serif-xl">{s.dailyDone === today ? 'On a roll. Keep going?' : 'Eight challenges. One surprise.'}</h2>
            <p className="daily-mix">
              <span>{Math.min(due, 3)} repasos</span>
              <span>3 nuevas</span>
              <span>1 sorpresa</span>
            </p>
            <Btn wide onClick={() => s.start({ kind: 'daily' })}>
              {s.lessons ? 'Siguiente lección' : 'Empezar'} <Icon name="arrow" size={16} />
            </Btn>
          </>
        )}
        {gate.state === 'locked-today' && (
          <>
            <div className="eyebrow">Modo repaso · contenido nuevo mañana</div>
            <h2 className="serif-xl">A few expressions need more attention.</h2>
            <p className="daily-sub">
              Mañana (desde las 00:00) empezamos por {gate.pending.length === 1 ? 'lo que' : `las ${gate.pending.length} cosas que`} se te resistieron. Hoy puedes seguir repasando todo lo que ya conoces.
            </p>
            <Btn wide variant="secondary" onClick={() => s.start({ kind: 'daily' })} disabled={!Object.keys(s.cards).length}>
              Repasar lo aprendido <Icon name="arrow" size={16} />
            </Btn>
          </>
        )}
        {gate.state === 'review-first' && (
          <>
            <div className="eyebrow">Primero, el repaso de ayer</div>
            <h2 className="serif-xl">
              {gate.pending.length === 1 ? 'Una cosa' : `${gate.pending.length} cosas`} que repasar y vía libre.
            </h2>
            <p className="daily-sub">Acierta las que fallaste y el contenido nuevo vuelve en cuanto termines. Sin esperar a nada más.</p>
            {owed.expression > 0 && (
              <Btn wide onClick={() => s.start({ kind: 'daily' })}>
                Repasar {owed.expression} expresi{owed.expression === 1 ? 'ón' : 'ones'} <Icon name="arrow" size={16} />
              </Btn>
            )}
            {owed.twist > 0 && (
              <Btn wide variant={owed.expression ? 'secondary' : 'primary'} onClick={() => s.start({ kind: 'twist' })}>
                Repasar {owed.twist} escena{owed.twist === 1 ? '' : 's'} de The Unexpected Twist
              </Btn>
            )}
            {owed.voice > 0 && (
              <Btn wide variant={owed.expression || owed.twist ? 'secondary' : 'primary'} onClick={() => s.start({ kind: 'voice' })}>
                Repasar {owed.voice} ronda{owed.voice === 1 ? '' : 's'} de Voice Acting
              </Btn>
            )}
          </>
        )}
      </motion.section>

      <section className="potd">
        <div className="eyebrow">Frase del día · {potd.level}</div>
        <p className="potd-en">
          <Highlight en={potd.en} />
        </p>
        <p className="potd-es">{potd.gist}</p>
        <div className="potd-actions">
          <button className="link" onClick={() => s.openExpression(potd.id)}>
            Ver ficha <Icon name="arrow" size={14} />
          </button>
          {s.cards[potd.id] ? (
            <span className="saved">
              <Icon name="check" size={14} /> En tu colección
            </span>
          ) : (
            <button className="link" onClick={() => s.savePhrase(potd.id)}>
              <Icon name="bookmark" size={14} /> Guardar
            </button>
          )}
        </div>
      </section>

      {due > 0 && (
        <button className="memory-cta" onClick={() => s.start({ kind: 'memory' })}>
          <span className="memory-glyph">◐</span>
          <div>
            <b>
              {due} expresi{due === 1 ? 'ón' : 'ones'} a punto de olvidarse
            </b>
            <small>Repaso de memoria · 2 minutos</small>
          </div>
          <Icon name="arrow" size={18} />
        </button>
      )}

      <div className="duo">
        <button className="tile" onClick={() => s.start({ kind: 'quickfire' })}>
          <span className="tile-glyph">⚡︎</span>
          <b>Quick Fire</b>
          <small>{s.stats.qfBest ? `Récord: ${s.stats.qfBest}` : '60 segundos de instinto'}</small>
        </button>
        <button className="tile" onClick={() => s.openPackSheet(recommended.id)}>
          <span className="tile-glyph">▸</span>
          <b>{s.packs[recommended.id]?.plays ? 'Seguir' : 'Para ti'}</b>
          <small>{recommended.title}</small>
        </button>
      </div>

      {weekly && (
        <section className="weekly" onClick={() => s.openPackSheet(weekly.id)}>
          <Poster pack={weekly} compact />
          <div>
            <div className="eyebrow">Colección de la semana</div>
            <b className="serif-md">{weekly.title}</b>
            <small>Episodios con ×1.5 XP hasta el domingo</small>
          </div>
        </section>
      )}

      <section className="block">
        <h3 className="block-title">
          Retos del día <span className="muted">{s.missions.list.filter((m) => m.claimed).length}/3</span>
        </h3>
        <ul className="missions">
          {s.missions.list.map((m) => {
            const ready = m.progress >= m.target && !m.claimed;
            return (
              <li key={m.id} className={m.claimed ? 'claimed' : ready ? 'ready' : ''}>
                <div className="m-main">
                  <span>{m.text}</span>
                  <Bar value={m.progress} max={m.target} tone={m.claimed ? 'olive' : 'muted'} />
                </div>
                {m.claimed ? (
                  <span className="m-done">
                    <Icon name="check" size={14} />
                  </span>
                ) : (
                  <button className="m-claim" disabled={!ready} onClick={() => s.claimMission(m.id)}>
                    {ready ? 'Cobrar' : `${m.progress}/${m.target}`} · {m.reward} XP
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {allClaimed && !s.missions.bonusClaimed && (
          <Btn wide variant="secondary" onClick={() => s.claimBonus()}>
            Bonus del día: +60 XP · escudo de racha · 2 comodines
          </Btn>
        )}
      </section>

      <section className="block recap">
        <h3 className="block-title">Tu semana</h3>
        <div className="week">
          {days.map((d) => {
            const v = s.activity[d] ?? 0;
            return (
              <div key={d} className={`wday ${d === today ? 'is-today' : ''}`}>
                <div className="wbar">
                  <motion.i initial={{ height: 0 }} animate={{ height: `${(v / maxXp) * 100}%` }} transition={{ duration: 0.6 }} />
                </div>
                <small>{new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'narrow' })}</small>
              </div>
            );
          })}
        </div>
        <p className="recap-line">
          <b>{weekXp}</b> XP · <b>{weekNew}</b> expresiones nuevas · <b>{Object.values(s.cards).filter((c) => c.box >= 5).length}</b> dominadas
        </p>
      </section>
      <p className="foot-quote">“{plain(PACKS[new Date().getDate() % PACKS.length].tagline)}”</p>
    </div>
  );
}
