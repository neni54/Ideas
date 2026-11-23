import { motion } from 'framer-motion';
import { useState } from 'react';
import { Hero, Npc, PetArt, Pip } from '../art/Art';
import { KIND_LABEL, LevelBriefing } from '../components/LevelBriefing';
import { Bar } from '../components/ui';
import { WORLD1 } from '../data/world1';
import type { Level } from '../data/types';
import { dayKey } from '../engine/date';
import { dueIds } from '../engine/srs';
import { currentLevel, useGame } from '../store/game';

const GREETINGS = ['¡Hola de nuevo', '¡Qué alegría verte', '¡Bienvenido', '¡El valle te esperaba'];

export function Home() {
  const s = useGame();
  const [brief, setBrief] = useState<Level | null>(null);
  const next = currentLevel(s.levels);
  const done = WORLD1.levels.filter((l) => s.levels[l.id]?.completed).length;
  const allDone = done === WORLD1.levels.length;
  const due = dueIds(s.srs, Date.now()).length;
  const totalEchoes = Object.keys(s.srs).length;
  const playedToday = s.lastPlayDay === dayKey();
  const missionsDone = s.missions.list.filter((m) => m.claimed).length;
  const greeting = GREETINGS[new Date().getDate() % GREETINGS.length];

  return (
    <div className="screen home">
      <section className="camp">
        <div className="camp-sky">
          <span className="camp-moon" />
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="twinkle" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 55}%`, animationDelay: `${(i % 5) * 0.4}s` }} />
          ))}
        </div>
        <div className="camp-hills" />
        <div className="camp-scene">
          <div className="camp-hero">
            <Hero size={92} skin={s.skin} mood="happy" />
          </div>
          <div className="campfire">
            <span className="fire f1" />
            <span className="fire f2" />
            <span className="fire f3" />
            <span className="logs" />
          </div>
          <div className="camp-pet float">{s.pet === 'pip' ? <Pip size={64} mood="happy" /> : <PetArt id={s.pet} size={62} />}</div>
        </div>
        <div className="camp-bubble">
          {greeting}, <b>{s.name}</b>!{' '}
          {allDone ? 'Has salvado el valle. ¡Repasa tus Ecos y consigue 3 estrellas!' : playedToday ? 'Hoy ya brilla tu llama. ¿Otra aventura?' : 'Juega un nivel hoy para avivar tu racha.'}
        </div>
      </section>

      <section className="world-progress card">
        <div className="wp-head">
          <div>
            <small>Mundo 1</small>
            <h3>{WORLD1.name}</h3>
          </div>
          <span className="wp-count">
            {done}/{WORLD1.levels.length}
          </span>
        </div>
        <Bar value={done} max={WORLD1.levels.length} color="linear-gradient(90deg,#06d6a0,#4cc9f0)" height={10} />
      </section>

      <motion.button
        className={`continue ${next.kind === 'boss' ? 'continue-boss' : ''}`}
        whileTap={{ scale: 0.97 }}
        onClick={() => setBrief(next)}
      >
        <div className="continue-portrait">
          <Npc id={next.character} size={64} />
        </div>
        <div className="continue-text">
          <small>
            {KIND_LABEL[next.kind].icon} {allDone ? 'Rejugar' : 'Continuar'} · Nivel {next.n}
          </small>
          <b>{next.title}</b>
        </div>
        <span className="continue-play">▶</span>
      </motion.button>

      {due > 0 ? (
        <motion.button className="echo-card" whileTap={{ scale: 0.97 }} onClick={() => s.play({ mode: 'echoes' })}>
          <span className="echo-orb">🔮</span>
          <div>
            <b>Santuario de Ecos</b>
            <small>
              {due} frase{due > 1 ? 's' : ''} olvidada{due > 1 ? 's' : ''} quiere{due > 1 ? 'n' : ''} volver
            </small>
          </div>
          <span className="echo-go">Repasar</span>
        </motion.button>
      ) : totalEchoes > 0 ? (
        <div className="echo-card calm">
          <span className="echo-orb">🌙</span>
          <div>
            <b>Ecos en reposo</b>
            <small>{totalEchoes} frase{totalEchoes > 1 ? 's' : ''} volverá{totalEchoes > 1 ? 'n' : ''} pronto para repasar</small>
          </div>
        </div>
      ) : null}

      <section className="card mini-missions" onClick={() => s.go('missions')}>
        <div className="wp-head">
          <h3>📜 Misiones de hoy</h3>
          <span className="wp-count">{missionsDone}/3</span>
        </div>
        {s.missions.list.map((m) => (
          <div key={m.id} className={`mm-row ${m.claimed ? 'claimed' : ''}`}>
            <span>{m.claimed ? '✅' : m.progress >= m.target ? '🎁' : '◻️'}</span>
            <span className="mm-text">{m.text}</span>
            <span className="mm-prog">
              {m.progress}/{m.target}
            </span>
          </div>
        ))}
      </section>

      <LevelBriefing level={brief} onClose={() => setBrief(null)} />
    </div>
  );
}
