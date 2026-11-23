import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sfx } from '../audio/sfx';
import { CoinIcon, FlameIcon, Hero } from '../art/Art';
import { levelFromXp } from '../engine/progression';
import { useGame, type Screen } from '../store/game';

export function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  big,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'magic';
  disabled?: boolean;
  className?: string;
  big?: boolean;
}) {
  return (
    <button
      className={`btn btn-${variant} ${big ? 'btn-big' : ''} ${className}`}
      disabled={disabled}
      onClick={() => {
        sfx.tap();
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export function Bar({ value, max, color = 'var(--xp)', height = 12, className = '' }: { value: number; max: number; color?: string; height?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={`bar ${className}`} style={{ height }}>
      <motion.div className="bar-fill" style={{ background: color }} initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
    </div>
  );
}

/** Animated number that counts up when it changes. */
export function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (value - a) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{shown}</>;
}

export function Hud() {
  const { xp, coins, streak, skin, lastPlayDay, go } = useGame();
  const { level, into, need } = levelFromXp(xp);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const lit = lastPlayDay === todayKey;
  return (
    <header className="hud">
      <button className="hud-player" onClick={() => go('profile')} aria-label="Perfil">
        <div className="hud-avatar">
          <Hero size={38} skin={skin} />
        </div>
        <div className="hud-level">
          <span className="hud-lv">Nv {level}</span>
          <Bar value={into} max={need} height={7} />
        </div>
      </button>
      <div className="hud-right">
        <div className={`chip ${lit ? 'chip-fire' : ''}`} title="Racha diaria">
          <FlameIcon size={20} lit={lit} />
          <b>{streak}</b>
        </div>
        <button className="chip chip-coin" onClick={() => go('bag')} title="Monedas">
          <CoinIcon size={20} />
          <b>
            <CountUp value={coins} />
          </b>
        </button>
      </div>
    </header>
  );
}

const NAV: { id: Screen; label: string; icon: string }[] = [
  { id: 'home', label: 'Inicio', icon: '🏕️' },
  { id: 'map', label: 'Mapa', icon: '🗺️' },
  { id: 'missions', label: 'Misiones', icon: '📜' },
  { id: 'bag', label: 'Mochila', icon: '🎒' },
  { id: 'profile', label: 'Perfil', icon: '🏅' },
];

export function BottomNav() {
  const { screen, go, missions } = useGame();
  const claimable = missions.list.some((m) => !m.claimed && m.progress >= m.target) || (!missions.chestClaimed && missions.list.every((m) => m.claimed));
  return (
    <nav className="nav">
      {NAV.map((n) => (
        <button
          key={n.id}
          className={`nav-item ${screen === n.id ? 'active' : ''}`}
          onClick={() => {
            sfx.tap();
            go(n.id);
          }}
        >
          <span className="nav-icon">{n.icon}</span>
          <span className="nav-label">{n.label}</span>
          {n.id === 'missions' && claimable && <span className="nav-dot" />}
          {screen === n.id && <motion.span layoutId="navPill" className="nav-pill" />}
        </button>
      ))}
    </nav>
  );
}

export function Modal({ open, onClose, children, className = '' }: { open: boolean; onClose?: () => void; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className={`modal ${className}`}
            initial={{ y: 60, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useGame();
  useEffect(() => {
    if (!toasts.length) return;
    sfx.chest();
    const t = setTimeout(() => dismissToast(toasts[0].id), 3200);
    return () => clearTimeout(t);
  }, [toasts, dismissToast]);
  const t = toasts[0];
  return (
    <div className="toasts">
      <AnimatePresence>
        {t && (
          <motion.div key={t.id} className="toast" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }} onClick={() => dismissToast(t.id)}>
            <span className="toast-icon">{t.icon}</span>
            <div>
              <small>{t.title}</small>
              <b>{t.text}</b>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Burst of particles (confetti / sparkles). */
export function Burst({ count = 24, colors = ['#ffd166', '#ef476f', '#06d6a0', '#7b61ff', '#4cc9f0'], spread = 160 }: { count?: number; colors?: string[]; spread?: number }) {
  const parts = useRef(
    Array.from({ length: count }).map((_, i) => ({
      a: (i / count) * Math.PI * 2 + Math.random() * 0.4,
      d: spread * (0.5 + Math.random() * 0.6),
      c: colors[i % colors.length],
      s: 6 + Math.random() * 6,
      r: Math.random() * 360,
    })),
  ).current;
  return (
    <div className="burst" aria-hidden>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          style={{ background: p.c, width: p.s, height: p.s * 0.6 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d + 60, opacity: 0, rotate: p.r + 360 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export function Stars({ n, size = 28, animate = false }: { n: number; size?: number; animate?: boolean }) {
  return (
    <div className="stars">
      {[1, 2, 3].map((i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={i === 2 ? 'star-mid' : ''}
          initial={animate ? { scale: 0, rotate: -90 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: animate ? 0.3 + i * 0.25 : 0, type: 'spring', stiffness: 300, damping: 12 }}
          onAnimationStart={() => animate && i <= n && setTimeout(() => sfx.coin(), 300 + i * 250)}
        >
          <path
            d="M12 1.8 L15.1 8.2 L22 9.1 L16.9 13.9 L18.2 20.8 L12 17.4 L5.8 20.8 L7.1 13.9 L2 9.1 L8.9 8.2 Z"
            fill={i <= n ? '#ffc93c' : 'rgba(255,255,255,.18)'}
            stroke={i <= n ? '#f29e00' : 'rgba(255,255,255,.25)'}
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        </motion.svg>
      ))}
    </div>
  );
}
