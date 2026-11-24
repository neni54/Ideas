// SIDEYE TOKENS: balance pill, MY TOKENS sheet (balance + history) and the EXTRA CHANCE panel.
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { create } from 'zustand';
import { BADGE_PRICE, EXTRA_CHANCE_PRICE } from '../engine/tokens';
import { useGame, useGate } from '../store/game';
import { Btn, Icon, Sheet } from './ui';

export const useTokensSheet = create<{ open: boolean; show: (v: boolean) => void }>((set) => ({ open: false, show: (open) => set({ open }) }));

/** Discreet balance, opens MY TOKENS. */
export function TokenPill({ className = '' }: { className?: string }) {
  const tokens = useGame((s) => s.tokens);
  const show = useTokensSheet((s) => s.show);
  return (
    <button className={`token-pill ${className}`} onClick={() => show(true)} aria-label={`My tokens: ${tokens}`}>
      <Icon name="token" size={16} />
      <b>{tokens}</b>
    </button>
  );
}

const fmt = (t: number) => new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' · ' + new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

export function TokensSheet() {
  const { open, show } = useTokensSheet();
  const tokens = useGame((s) => s.tokens);
  const log = useGame((s) => s.tokenLog);
  const go = useGame((s) => s.go);
  return (
    <Sheet open={open} onClose={() => show(false)} className="tokens-sheet">
      <div className="eyebrow">My tokens</div>
      <div className="tk-balance">
        <span className="tk-coin">
          <Icon name="token" size={30} />
        </span>
        <b>{tokens}</b>
        <span>SIDEYE TOKENS</span>
      </div>
      <ul className="tk-rules">
        <li>
          <b>+1</b> por cada lección o episodio <em>sin ningún error</em>. Cada lección paga una sola vez.
        </li>
        <li>
          <b>−{EXTRA_CHANCE_PRICE}</b> EXTRA CHANCE: una lección más el día que llegas a 3 errores.
        </li>
        <li>
          <b>−{BADGE_PRICE}</b> un escudo de THE BADGE SHOP.
        </li>
      </ul>
      <p className="tk-fine">No caducan, los errores no los quitan y no se compran con dinero.</p>
      <div className="label">Historial</div>
      {log.length === 0 ? (
        <p className="tk-empty">Todavía no hay movimientos. Termina una lección sin errores para ganar tu primer token.</p>
      ) : (
        <ul className="tk-log">
          {log.map((m) => (
            <li key={m.id}>
              <span className={`tk-delta ${m.delta > 0 ? 'plus' : 'minus'}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
              <span className="tk-reason">
                {m.reason}
                <small>{fmt(m.at)}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Btn
        wide
        variant="secondary"
        onClick={() => {
          show(false);
          go('shop');
        }}
      >
        <Icon name="shop" size={16} /> The Badge Shop
      </Btn>
    </Sheet>
  );
}

/** Shown on the day of a 3-mistake lock: EXTRA CHANCE (1 token) or wait until tomorrow. */
export function ExtraChancePanel({ onWait, compact = false }: { onWait?: () => void; compact?: boolean }) {
  const gate = useGate();
  const tokens = useGame((s) => s.tokens);
  const chance = useGame((s) => s.extraChance);
  const buy = useGame((s) => s.buyExtraChance);
  const start = useGame((s) => s.start);
  const [waiting, setWaiting] = useState(false);
  const [busy, setBusy] = useState(false);
  if (gate.state !== 'locked-today') return null;

  if (gate.extra)
    return (
      <motion.section className="xc xc-on" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="eyebrow">Extra chance · activa</div>
        <p className="xc-title">{chance && chance.left > 1 ? `${chance.left} lecciones extra hoy.` : 'Una lección más hoy.'}</p>
        <p className="xc-sub">Tus errores y el repaso de mañana se mantienen. Si vuelves a llegar a 3 errores, podrás usar otro token.</p>
        <Btn wide onClick={() => start({ kind: 'daily' })}>
          Empezar la lección <Icon name="arrow" size={16} />
        </Btn>
      </motion.section>
    );

  if (waiting) return null;
  const enough = tokens >= EXTRA_CHANCE_PRICE;
  return (
    <motion.section className={`xc ${compact ? 'xc-compact' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="eyebrow">Extra chance</div>
      <p className="xc-title">¿Una lección más hoy?</p>
      <p className="xc-sub">
        Usa 1 token para hacer otra lección con contenido nuevo. Los errores de hoy y el repaso de mañana no cambian. Saldo: <b>{tokens} {tokens === 1 ? 'token' : 'tokens'}</b>.
      </p>
      <button
        className="xc-buy"
        disabled={!enough || busy}
        onClick={() => {
          if (busy) return;
          setBusy(true);
          buy();
          setBusy(false);
        }}
      >
        <Icon name="token" size={18} /> EXTRA CHANCE — USE 1 TOKEN
      </button>
      {!enough && <p className="xc-none">No tienes tokens. Toca esperar a mañana: el contenido nuevo vuelve a las 00:00. Los tokens se ganan con lecciones sin errores.</p>}
      <button
        className="xc-wait"
        onClick={() => {
          setWaiting(true);
          onWait?.();
        }}
      >
        WAIT UNTIL TOMORROW
      </button>
    </motion.section>
  );
}

/** "+1 SIDEYE TOKEN" on the results screen. */
export function TokenResult({ earned, already }: { earned?: boolean; already?: boolean }) {
  const tokens = useGame((s) => s.tokens);
  const show = useTokensSheet((s) => s.show);
  return (
    <AnimatePresence>
      {earned && (
        <motion.button className="tk-earned" onClick={() => show(true)} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
          <span className="tk-coin">
            <Icon name="token" size={26} />
          </span>
          <span>
            <b>+1 SIDEYE TOKEN</b>
            <small>Lección sin errores · saldo: {tokens}</small>
          </span>
        </motion.button>
      )}
      {!earned && already && <p className="tk-already">Lección perfecta. Su token ya lo ganaste la primera vez: cada lección paga una sola vez.</p>}
    </AnimatePresence>
  );
}
