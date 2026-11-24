import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sfx } from '../audio/sfx';
import { useGame, type Screen } from '../store/game';

/* ───── Icons (line, 24px grid) ───── */

const PATHS: Record<string, ReactNode> = {
  today: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  library: <><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="16" rx="1" /><path d="M17.5 4.8l3.2.9-3.6 14.4-3.2-.8" /></>,
  games: <><path d="M12 3l9 9-9 9-9-9z" /><path d="M12 8v8M8 12h8" /></>,
  phrases: <><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z" /><path d="M5 17a3 3 0 013-3h11" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  flame: <path d="M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2.5 1.5-3.5 2-6 1.2 1 2 2.5 2 4 1-1.5 1.3-4 1-8z" />,
  play: <path d="M7 4.5v15l12-7.5z" />,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  volume: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  bolt: <path d="M13 2L5 13.5h6L10 22l9-12h-6z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  bookmark: <path d="M6 3.5h12v17l-6-4-6 4z" />,
  shield: <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z" />,
  half: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17A8.5 8.5 0 0012 3.5z" fill="currentColor" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  sparkle: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" />,
  bulb: <><path d="M9 17h6M10 20.5h4" /><path d="M8.5 13.5A5.5 5.5 0 1115.5 13.5c-.9.8-1.5 1.8-1.5 3h-4c0-1.2-.6-2.2-1.5-3z" /></>,
  pause: <><rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" /></>,
  translate: <><path d="M4 5h9M8.5 3v2c0 4-2 7-5 9" /><path d="M6 9c1.5 2.5 3.5 4 6 5" /><path d="M12.5 21l4-9 4 9M14 18h5" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" /></>,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  refresh: <><path d="M20 11a8 8 0 00-14.5-4.5L4 8.5" /><path d="M4 4v4.5h4.5" /><path d="M4 13a8 8 0 0014.5 4.5L20 15.5" /><path d="M20 20v-4.5h-4.5" /></>,
};

export function Icon({ name, size = 20, className = '', fill = false }: { name: keyof typeof PATHS | string; size?: number; className?: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`icon ${className}`} fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/* ───── Buttons & bits ───── */

export function Btn({ children, onClick, variant = 'primary', disabled, className = '', wide }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'quiet'; disabled?: boolean; className?: string; wide?: boolean }) {
  return (
    <button
      className={`btn btn-${variant} ${wide ? 'btn-wide' : ''} ${className}`}
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

export function Bar({ value, max, className = '', tone = 'accent' }: { value: number; max: number; className?: string; tone?: 'accent' | 'olive' | 'cream' | 'muted' }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={`bar ${className}`}>
      <motion.div className={`bar-fill tone-${tone}`} initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 110, damping: 22 }} />
    </div>
  );
}

export function Ring({ value, size = 44, stroke = 3, children, tone = 'accent' }: { value: number; size?: number; stroke?: number; children?: ReactNode; tone?: 'accent' | 'olive' | 'cream' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={`ring-fill tone-${tone}`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, value))) }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-inner">{children}</div>
    </div>
  );
}

export function Dots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="dots" aria-label={`Dominio ${value} de ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <i key={i} className={i < value ? 'on' : ''} />
      ))}
    </span>
  );
}

export function CountUp({ value, duration = 800 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      setShown(Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{shown}</>;
}

/** Bottom sheet on phones, centred dialog on wider screens. */
export function Sheet({ open, onClose, children, className = '' }: { open: boolean; onClose?: () => void; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!open || !onClose) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className={`sheet ${className}`}
            role="dialog"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {onClose && (
              <button className="sheet-x" onClick={onClose} aria-label="Cerrar">
                <Icon name="x" size={18} />
              </button>
            )}
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
    sfx.unlock();
    const t = setTimeout(() => dismissToast(toasts[0].id), 3400);
    return () => clearTimeout(t);
  }, [toasts, dismissToast]);
  const t = toasts[0];
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {t && (
          <motion.button key={t.id} className="toast" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} onClick={() => dismissToast(t.id)}>
            <Icon name="sparkle" size={18} />
            <div>
              <small>{t.title}</small>
              <b>{t.text}</b>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

const NAV: { id: Screen; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'library', label: 'Colecciones' },
  { id: 'games', label: 'Juegos' },
  { id: 'phrases', label: 'Frases' },
  { id: 'translate', label: 'Traductor' },
  { id: 'profile', label: 'Perfil' },
];

export function BottomNav() {
  const { tab, go, missions } = useGame();
  const claimable = missions.list.some((m) => !m.claimed && m.progress >= m.target);
  return (
    <nav className="nav">
      {NAV.map((n) => (
        <button key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => go(n.id)} aria-label={n.label}>
          <Icon name={n.id} size={21} />
          <span>{n.label}</span>
          {n.id === 'today' && claimable && <i className="nav-dot" />}
        </button>
      ))}
    </nav>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`eyebrow ${className}`}>{children}</div>;
}
