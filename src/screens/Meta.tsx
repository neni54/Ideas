import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChestArt, CoinIcon, FlameIcon, Hero, PetArt } from '../art/Art';
import { sfx } from '../audio/sfx';
import { Bar, Btn, Modal } from '../components/ui';
import { ACHIEVEMENTS, ITEMS, PETS, SKINS } from '../data/meta';
import { WORLD1 } from '../data/world1';
import { levelFromXp } from '../engine/progression';
import { useGame, type ChestLoot } from '../store/game';
import { ChestOpener } from './Results';

/* ───────────── Missions ───────────── */

export function Missions() {
  const s = useGame();
  const [loot, setLoot] = useState<ChestLoot | null>(null);
  const allClaimed = s.missions.list.every((m) => m.claimed);
  const hoursLeft = 24 - new Date().getHours();

  return (
    <div className="screen missions">
      <h1 className="screen-title">Misiones diarias</h1>
      <p className="muted center">Se renuevan en {hoursLeft} h</p>

      <div className="mission-list">
        {s.missions.list.map((m, i) => {
          const ready = m.progress >= m.target && !m.claimed;
          return (
            <motion.div key={m.id} className={`mission card ${ready ? 'ready' : ''} ${m.claimed ? 'claimed' : ''}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="mission-main">
                <b>{m.text}</b>
                <Bar value={m.progress} max={m.target} color={m.claimed ? '#06d6a0' : 'linear-gradient(90deg,#ffd166,#ff9f1c)'} height={10} />
                <small>
                  {m.progress}/{m.target}
                </small>
              </div>
              {m.claimed ? (
                <span className="mission-done">✓</span>
              ) : (
                <button
                  className={`mission-claim ${ready ? 'on' : ''}`}
                  disabled={!ready}
                  onClick={() => {
                    if (s.claimMission(m.id)) sfx.coin();
                  }}
                >
                  <CoinIcon size={18} /> {m.reward}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className={`daily-chest card ${allClaimed && !s.missions.chestClaimed ? 'ready' : ''}`}>
        <div className={allClaimed && !s.missions.chestClaimed ? 'shake' : ''}>
          <ChestArt size={96} tier="rare" open={s.missions.chestClaimed} />
        </div>
        <div>
          <b>Cofre diario</b>
          <small>{s.missions.chestClaimed ? '¡Abierto! Vuelve mañana.' : 'Completa las 3 misiones para abrirlo.'}</small>
          {allClaimed && !s.missions.chestClaimed && (
            <Btn
              onClick={() => {
                const l = s.claimDailyChest();
                if (l) setLoot(l);
              }}
            >
              Abrir
            </Btn>
          )}
        </div>
      </div>

      <div className="card streak-card">
        <FlameIcon size={40} lit={s.streak > 0} />
        <div>
          <b>Racha de {s.streak} día{s.streak === 1 ? '' : 's'}</b>
          <small>Mejor racha: {s.bestStreak} · 🛡️ Escudos: {s.items.freeze}</small>
        </div>
      </div>

      <Modal open={!!loot} onClose={() => setLoot(null)}>
        <h2 className="title-lg">Cofre diario</h2>
        {loot && <ChestOpener loot={loot} />}
        <Btn onClick={() => setLoot(null)}>Guardar en la mochila</Btn>
      </Modal>
    </div>
  );
}

/* ───────────── Bag / Inventory / Shop ───────────── */

export function Bag() {
  const s = useGame();
  const [tab, setTab] = useState<'items' | 'pets' | 'skins'>('items');
  const [flash, setFlash] = useState<string | null>(null);
  const bought = (ok: boolean, msg: string) => {
    if (ok) {
      sfx.coin();
      setFlash(msg);
      setTimeout(() => setFlash(null), 1400);
    } else sfx.wrong();
  };

  return (
    <div className="screen bag">
      <h1 className="screen-title">Mochila</h1>
      <div className="wallet card">
        <CoinIcon size={34} />
        <div>
          <b>{s.coins}</b>
          <small>monedas</small>
        </div>
      </div>

      <div className="tabs">
        {(
          [
            ['items', '🎒 Objetos'],
            ['pets', '🐾 Mascotas'],
            ['skins', '🧥 Skins'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <div className="shop-list">
          {ITEMS.map((it) => (
            <div key={it.id} className="shop-item card">
              <span className="shop-icon">{it.icon}</span>
              <div className="shop-info">
                <b>
                  {it.name} <span className="owned">×{s.items[it.id]}</span>
                </b>
                <small>{it.desc}</small>
              </div>
              <button className="buy" disabled={s.coins < it.price} onClick={() => bought(s.buyItem(it.id), `+1 ${it.name}`)}>
                <CoinIcon size={16} /> {it.price}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'pets' && (
        <div className="grid2">
          {PETS.map((p) => {
            const owned = s.pets.includes(p.id);
            const active = s.pet === p.id;
            return (
              <div key={p.id} className={`pet-card card ${active ? 'active' : ''}`}>
                <div className="pet-art float">
                  <PetArt id={p.id} size={70} />
                </div>
                <b>{p.name}</b>
                <small>{p.desc}</small>
                {owned ? (
                  <button className={`equip ${active ? 'on' : ''}`} onClick={() => s.setPet(p.id)}>
                    {active ? 'Contigo' : 'Llevar'}
                  </button>
                ) : (
                  <button className="buy" disabled={s.coins < p.price} onClick={() => bought(s.buyPet(p.id), `¡${p.name} se une a ti!`)}>
                    <CoinIcon size={16} /> {p.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'skins' && (
        <div className="grid2">
          {SKINS.map((k) => {
            const owned = s.skins.includes(k.id);
            const active = s.skin === k.id;
            return (
              <div key={k.id} className={`pet-card card ${active ? 'active' : ''}`}>
                <Hero size={70} skin={k.id} />
                <b>{k.name}</b>
                {k.id === 'night' && !owned && <small>O derrota a Morvena</small>}
                {owned ? (
                  <button className={`equip ${active ? 'on' : ''}`} onClick={() => s.setSkin(k.id)}>
                    {active ? 'Equipada' : 'Equipar'}
                  </button>
                ) : (
                  <button className="buy" disabled={s.coins < k.price} onClick={() => bought(s.buySkin(k.id), `¡${k.name} equipada!`)}>
                    <CoinIcon size={16} /> {k.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {flash && (
        <motion.div className="flash" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {flash}
        </motion.div>
      )}
    </div>
  );
}

/* ───────────── Profile / Achievements / Settings ───────────── */

export function Profile() {
  const s = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const { level, into, need } = levelFromXp(s.xp);
  const done = WORLD1.levels.filter((l) => s.levels[l.id]?.completed).length;
  const stars = Object.values(s.levels).reduce((a, l) => a + l.stars, 0);
  const acc = s.stats.answered ? Math.round((s.stats.correct / s.stats.answered) * 100) : 0;
  const unlocked = Object.keys(s.achievements).length;

  return (
    <div className="screen profile">
      <div className="profile-head card">
        <div className="profile-avatar">
          <Hero size={86} skin={s.skin} mood="happy" />
          <span className="profile-lv">{level}</span>
        </div>
        <div className="profile-info">
          <h2>{s.name}</h2>
          <small>Portador de Luz · Nivel {level}</small>
          <Bar value={into} max={need} height={10} />
          <small className="muted">
            {into}/{need} XP para el nivel {level + 1}
          </small>
        </div>
      </div>

      <div className="stat-grid four">
        <div className="stat">
          <span className="stat-emoji">🔥</span>
          <b>{s.streak}</b>
          <small>Racha</small>
        </div>
        <div className="stat">
          <span className="stat-emoji">⭐</span>
          <b>
            {stars}/{WORLD1.levels.length * 3}
          </b>
          <small>Estrellas</small>
        </div>
        <div className="stat">
          <span className="stat-emoji">🎯</span>
          <b>{acc}%</b>
          <small>Precisión</small>
        </div>
        <div className="stat">
          <span className="stat-emoji">🔮</span>
          <b>{s.mastered}</b>
          <small>Ecos dominados</small>
        </div>
        <div className="stat">
          <span className="stat-emoji">🗺️</span>
          <b>{done}/20</b>
          <small>Niveles</small>
        </div>
        <div className="stat">
          <span className="stat-emoji">✅</span>
          <b>{s.stats.correct}</b>
          <small>Aciertos</small>
        </div>
      </div>

      <h3 className="section-title">
        Logros <span className="muted">{unlocked}/{ACHIEVEMENTS.length}</span>
      </h3>
      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => {
          const got = !!s.achievements[a.id];
          return (
            <div key={a.id} className={`ach ${got ? 'got' : ''}`} title={a.desc}>
              <span className="ach-icon">{got ? a.icon : '🔒'}</span>
              <b>{a.name}</b>
              <small>{a.desc}</small>
            </div>
          );
        })}
      </div>

      <h3 className="section-title">Ajustes</h3>
      <div className="card settings">
        <label className="toggle">
          <span>🔔 Efectos de sonido</span>
          <input type="checkbox" checked={s.settings.sound} onChange={() => s.toggleSetting('sound')} />
          <i />
        </label>
        <label className="toggle">
          <span>🗣️ Voz en inglés automática</span>
          <input type="checkbox" checked={s.settings.voice} onChange={() => s.toggleSetting('voice')} />
          <i />
        </label>
        <button className="link-danger" onClick={() => setConfirmReset(true)}>
          Borrar partida
        </button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <h2 className="title-lg">¿Borrar toda la partida?</h2>
        <p className="muted">Perderás niveles, monedas, mascotas y logros. No se puede deshacer.</p>
        <div className="modal-actions">
          <Btn variant="primary" onClick={() => setConfirmReset(false)}>
            Cancelar
          </Btn>
          <Btn
            variant="ghost"
            onClick={() => {
              s.reset();
              setConfirmReset(false);
            }}
          >
            Borrar
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
