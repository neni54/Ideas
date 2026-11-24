import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sfx } from '../audio/sfx';
import { Btn, CountUp, Icon, Sheet } from '../components/ui';
import { ALL, plain } from '../data/content';
import { ACHIEVEMENTS, titleFor } from '../data/meta';
import { verdict } from '../data/voice';
import { useGame, useGate } from '../store/game';
import { runLabel } from './Play';

const mmss = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Results() {
  const { result, start, quit, openExpression, stats, cards } = useGame();
  const gate = useGate();
  const [levelUp, setLevelUp] = useState(false);
  useEffect(() => {
    if (!result) return;
    sfx.unlock();
    if (result.levelUp) {
      const t = setTimeout(() => setLevelUp(true), 1400);
      return () => clearTimeout(t);
    }
  }, [result]);
  if (!result) return null;

  const isQF = result.run.kind === 'quickfire';
  const isMem = result.run.kind === 'memory';
  const v = isQF
    ? { title: result.newBest ? 'New personal best.' : result.score! >= 15 ? 'Fast and right. Rare combo.' : 'Speed is a skill. Keep training it.', sub: `Récord: ${stats.qfBest}` }
    : isMem
      ? { title: result.firstTry === result.total ? 'Nothing forgotten. Suspicious.' : 'Memory refreshed.', sub: 'Lo que costó volverá antes. Lo que sabías, más tarde.' }
      : verdict(result.accuracy);

  return (
    <div className="screen results">
      <div className="eyebrow">{runLabel(result.run)} · terminado</div>
      <motion.h1 className="display" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {v.title}
      </motion.h1>
      <p className="muted lead">{v.sub}</p>

      {result.lockTriggered && (
        <motion.section className="lock-note" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="lock-title">
            {result.lockTriggered.mistakes === 3 ? 'Three mistakes.' : `${result.lockTriggered.mistakes} mistakes.`} Looks like a few expressions need more attention. Tomorrow we&rsquo;ll make sure you master them.
          </p>
          <p>
            El contenido nuevo vuelve mañana (desde las 00:00 de tu hora local), y empezaremos repasando estas {result.lockTriggered.ids.length} expresiones. Hoy puedes seguir
            repasando lo que ya conoces, jugar a Memory y Quick Fire, y consultar tu colección.
          </p>
          <ul className="xlist">
            {result.lockTriggered.ids.map((id) => (
              <li key={id}>
                <button onClick={() => openExpression(id)}>
                  <span className="xlist-en">{plain(ALL[id].en)}</span>
                  <span className="xlist-es">{ALL[id].gist}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.section>
      )}
      {result.reviewCleared && (
        <div className="clear-note">
          <Icon name="check" size={16} /> <b>Review done. Back to new stuff.</b> El repaso de ayer está superado: el contenido nuevo vuelve a estar disponible.
        </div>
      )}
      {result.mistakeCount !== undefined && !result.lockTriggered && (
        <p className="miss-note">
          {result.mistakeCount === 0 ? 'Cero fallos.' : result.mistakeCount === 1 ? 'Un fallo.' : 'Dos fallos.'} Puedes seguir aprendiendo ahora mismo.
        </p>
      )}

      <div className="kpis">
        {isQF ? (
          <div className="kpi">
            <b>
              <CountUp value={result.score ?? 0} />
            </b>
            <small>aciertos en 60 s</small>
          </div>
        ) : (
          <div className="kpi">
            <b>
              <CountUp value={Math.round(result.accuracy * 100)} />%
            </b>
            <small>{isMem ? 'recordadas' : 'a la primera'}</small>
          </div>
        )}
        <div className="kpi">
          <b>
            +<CountUp value={result.totalXp} />
          </b>
          <small>XP</small>
        </div>
        <div className="kpi">
          <b>{isMem ? result.total : `×${result.maxCombo}`}</b>
          <small>{isMem ? 'tarjetas' : 'mejor racha'}</small>
        </div>
        <div className="kpi">
          <b>{mmss(result.ms)}</b>
          <small>tiempo</small>
        </div>
      </div>

      {result.bonuses.length > 0 && (
        <ul className="ledger">
          {result.bonuses.map((b) => (
            <li key={b.label}>
              <span>{b.label}</span>
              <b>+{b.xp}</b>
            </li>
          ))}
        </ul>
      )}

      {result.streakUp && (
        <motion.div className="streak-note" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Icon name="flame" size={18} /> Día {result.streakUp} de racha. {result.streakUp % 7 === 0 ? 'Has ganado un escudo de racha.' : 'Mañana, otra.'}
        </motion.div>
      )}

      {result.newAchievements.length > 0 && (
        <div className="ach-note">
          {result.newAchievements.map((id) => (
            <span key={id}>
              <Icon name="sparkle" size={14} /> {ACHIEVEMENTS.find((a) => a.id === id)?.name}
            </span>
          ))}
        </div>
      )}

      {result.newIds.length > 0 && (
        <section className="block">
          <h3 className="block-title">Nuevas en tu colección · {result.newIds.length}</h3>
          <ul className="xlist">
            {result.newIds.map((id) => (
              <li key={id}>
                <button onClick={() => openExpression(id)}>
                  <span className="xlist-en">{plain(ALL[id].en)}</span>
                  <span className="xlist-es">{ALL[id].es}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.missedIds.length > 0 && (
        <section className="block">
          <h3 className="block-title">Para repasar · vuelven en Memory</h3>
          <ul className="xlist">
            {result.missedIds.map((id) => (
              <li key={id}>
                <button onClick={() => openExpression(id)}>
                  <span className="xlist-en">{plain(ALL[id].en)}</span>
                  <span className="xlist-es">{ALL[id].gist}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="row-actions sticky-actions">
        {isQF || isMem ? (
          <>
            <Btn variant="ghost" onClick={() => start(result.run)}>
              <Icon name="refresh" size={16} /> Otra vez
            </Btn>
            <Btn onClick={() => quit()}>Continuar</Btn>
          </>
        ) : gate.canLearnNew ? (
          <>
            <Btn variant="ghost" onClick={() => quit()}>
              Volver
            </Btn>
            <Btn onClick={() => start({ kind: 'daily' })}>
              Siguiente lección <Icon name="arrow" size={16} />
            </Btn>
          </>
        ) : (
          <>
            <Btn variant="ghost" onClick={() => quit()}>
              Volver
            </Btn>
            <Btn onClick={() => start({ kind: 'daily' })} disabled={!Object.keys(cards).length}>
              {gate.state === 'review-first' ? 'Seguir con el repaso' : 'Repasar lo aprendido'}
            </Btn>
          </>
        )}
      </div>

      <Sheet open={levelUp} onClose={() => setLevelUp(false)} className="levelup">
        <div className="eyebrow">Level up</div>
        <p className="levelup-n">{result.levelUp?.to}</p>
        <p className="serif-lg">{titleFor(result.levelUp?.to ?? 1)}</p>
        <p className="muted">Antes eras {titleFor(result.levelUp?.from ?? 1)}. Ahora se nota. Puede que hayas desbloqueado nuevas colecciones.</p>
        <Btn wide onClick={() => setLevelUp(false)}>
          Seguir
        </Btn>
      </Sheet>
    </div>
  );
}
