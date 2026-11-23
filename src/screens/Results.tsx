import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ChestArt, CoinIcon, FlameIcon, Hero, Npc, Pip, XpIcon } from '../art/Art';
import { sfx } from '../audio/sfx';
import { Btn, Burst, CountUp, Modal, Stars } from '../components/ui';
import { ITEMS, SKINS } from '../data/meta';
import { WORLD1 } from '../data/world1';
import { useGame, type ChestLoot } from '../store/game';

export function LootList({ loot }: { loot: ChestLoot }) {
  return (
    <div className="loot">
      <motion.div className="loot-item" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
        <CoinIcon size={30} /> <b>+{loot.coins}</b>
      </motion.div>
      {Object.entries(loot.items).map(([id, n], i) => {
        const it = ITEMS.find((x) => x.id === id)!;
        return (
          <motion.div key={id} className="loot-item" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35 + i * 0.15 }}>
            <span className="loot-icon">{it.icon}</span> <b>+{n}</b>
            <small>{it.name}</small>
          </motion.div>
        );
      })}
      {loot.skin && (
        <motion.div className="loot-item epic" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }}>
          <Hero size={40} skin={loot.skin} /> <small>{SKINS.find((s) => s.id === loot.skin)?.name}</small>
        </motion.div>
      )}
    </div>
  );
}

export function ChestOpener({ loot, onDone }: { loot: ChestLoot; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="chest-opener">
      <motion.button
        className={`chest-btn ${open ? 'opened' : 'shake'}`}
        onClick={() => {
          if (open) return;
          setOpen(true);
          sfx.chest();
          onDone?.();
        }}
        whileTap={{ scale: 0.92 }}
      >
        <ChestArt size={140} open={open} tier={loot.tier} />
        {open && <Burst count={30} spread={180} />}
      </motion.button>
      {open ? <LootList loot={loot} /> : <p className="tap-hint">¡Toca el cofre para abrirlo!</p>}
    </div>
  );
}

export function Results() {
  const { result, go, play } = useGame();
  const [chestOpened, setChestOpened] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  useEffect(() => {
    if (result && !result.failed) setTimeout(() => sfx.levelUp(), 200);
  }, [result]);
  if (!result) return null;

  const level = result.target.mode === 'level' ? WORLD1.levels.find((l) => l.id === (result.target as { levelId: string }).levelId) : null;
  const isBoss = level?.kind === 'boss';
  const nextLevel = level ? WORLD1.levels[level.n] : undefined;

  const leave = () => {
    if (result.levelUp && !showLevelUp) {
      setShowLevelUp(true);
      sfx.levelUp();
      return;
    }
    go(level ? 'map' : 'home');
  };

  const title = result.failed
    ? `${level!.boss!.name} resiste…`
    : isBoss
      ? '¡Victoria!'
      : level
        ? result.stars === 3
          ? '¡Nivel perfecto!'
          : '¡Nivel completado!'
        : '¡Ecos repasados!';

  return (
    <div className={`screen results ${result.failed ? 'results-fail' : ''}`}>
      {!result.failed && <Burst count={36} spread={220} />}
      <div className="results-hero">
        {isBoss ? <Npc id={level!.character} size={120} mood={result.failed ? 'idle' : 'sad'} /> : <Pip size={120} mood={result.stars >= 2 || !level ? 'happy' : 'idle'} />}
      </div>
      <motion.h1 className="title-xl" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
        {title}
      </motion.h1>
      {isBoss && <p className="results-quote">“{result.failed ? '¡Ja! Vuelve cuando tus palabras brillen más… (Sigue herido: la próxima vez tendrá menos vida)' : level!.boss!.defeat}”</p>}
      {level && !result.failed && <Stars n={result.stars} size={52} animate />}

      <div className="stat-grid">
        <div className="stat">
          <XpIcon size={26} />
          <b>
            +<CountUp value={result.totalXp} duration={900} />
          </b>
          <small>XP</small>
        </div>
        <div className="stat">
          <CoinIcon size={26} />
          <b>
            +<CountUp value={result.totalCoins} duration={900} />
          </b>
          <small>Monedas</small>
        </div>
        <div className="stat">
          <span className="stat-emoji">🎯</span>
          <b>{Math.round(result.accuracy * 100)}%</b>
          <small>Precisión</small>
        </div>
        <div className="stat">
          <span className="stat-emoji">🔥</span>
          <b>×{result.maxCombo}</b>
          <small>Combo máx.</small>
        </div>
      </div>

      {(result.echoesCleared > 0 || result.timeBonus > 0 || result.firstClear) && (
        <div className="bonus-row">
          {result.firstClear && <span>🏁 Primera vez +30 XP</span>}
          {result.echoesCleared > 0 && <span>🔮 {result.echoesCleared} Ecos acertados</span>}
          {result.timeBonus > 0 && <span>⏳ +{result.timeBonus} por tiempo</span>}
        </div>
      )}

      {result.streakUp && (
        <motion.div className="streak-banner" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring' }}>
          <FlameIcon size={34} /> <b>¡Racha de {result.streakUp} día{result.streakUp > 1 ? 's' : ''}!</b>
        </motion.div>
      )}

      {result.chest && (
        <div className="card results-chest">
          <h3>{result.chest.tier === 'epic' ? '🏆 Cofre épico' : '🗝️ Cofre de los sellos'}</h3>
          <ChestOpener loot={result.chest} onDone={() => setChestOpened(true)} />
        </div>
      )}

      {result.unlockedLevel && nextLevel && <p className="unlock-note">🔓 Desbloqueado: <b>Nivel {nextLevel.n} · {nextLevel.title}</b></p>}

      <div className="results-actions">
        {result.failed ? (
          <>
            <Btn big variant="danger" onClick={() => play(result.target)}>
              Revancha
            </Btn>
            <Btn variant="ghost" onClick={() => go('map')}>
              Volver al mapa
            </Btn>
          </>
        ) : (
          <Btn big disabled={!!result.chest && !chestOpened} onClick={leave}>
            {result.chest && !chestOpened ? 'Abre el cofre' : 'Continuar'}
          </Btn>
        )}
      </div>

      <Modal open={showLevelUp} onClose={() => go(level ? 'map' : 'home')} className="levelup">
        <Burst count={30} spread={200} />
        <div className="levelup-badge">
          <span>{result.levelUp?.to}</span>
        </div>
        <h2 className="title-xl">¡Subes de nivel!</h2>
        <p className="muted">Tu luz es más fuerte. Nivel {result.levelUp?.from} → {result.levelUp?.to}</p>
        <Btn big onClick={() => go(level ? 'map' : 'home')}>
          ¡Genial!
        </Btn>
      </Modal>
    </div>
  );
}
