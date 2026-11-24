// THE BADGE SHOP + MY BADGE COLLECTION (AMERICA COLLECTION). Collectibles only.
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { BADGES, BADGE_BY_ID, BadgeArt } from '../data/badges';
import { BADGE_PRICE } from '../engine/tokens';
import { useGame } from '../store/game';
import { TokenPill, useTokensSheet } from '../components/Tokens';
import { Btn, Icon, Sheet } from '../components/ui';

type Tab = 'shop' | 'collection';

export function Shop() {
  const owned = useGame((s) => s.badges);
  const [tab, setTab] = useState<Tab>('shop');
  const [open, setOpen] = useState<string | null>(null);
  const count = BADGES.filter((b) => owned[b.id]).length;
  return (
    <div className="screen shop">
      <div className="shop-top">
        <div className="eyebrow">America Collection · 10 escudos</div>
        <TokenPill />
      </div>
      <h1 className="shop-title">
        {tab === 'shop' ? (
          <>
            THE BADGE <em>SHOP</em>
          </>
        ) : (
          <>
            MY BADGE <em>COLLECTION</em>
          </>
        )}
      </h1>
      <p className="muted">
        {tab === 'shop'
          ? 'Escudos de colección inspirados en Estados Unidos. Cada uno cuesta 10 tokens y es tuyo para siempre. Son solo coleccionables: no dan puntos ni ventajas.'
          : count === 0
            ? 'Todavía no tienes escudos. Los que te faltan aparecen bloqueados: cómpralos en la tienda con tus tokens.'
            : `${count} de ${BADGES.length} escudos. Los que te faltan aparecen bloqueados.`}
      </p>
      <div className="sp-seg shop-seg" role="tablist">
        <button role="tab" aria-selected={tab === 'shop'} className={tab === 'shop' ? 'on' : ''} onClick={() => setTab('shop')}>
          The Badge Shop
        </button>
        <button role="tab" aria-selected={tab === 'collection'} className={tab === 'collection' ? 'on' : ''} onClick={() => setTab('collection')}>
          Collection · {count}/{BADGES.length}
        </button>
      </div>
      {tab === 'collection' && (
        <div className="shop-progress" aria-hidden>
          <i style={{ width: `${(count / BADGES.length) * 100}%` }} />
        </div>
      )}
      <ul className="badge-grid">
        {BADGES.map((b, i) => {
          const have = !!owned[b.id];
          const locked = tab === 'collection' && !have;
          return (
            <motion.li key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <button className={`badge-tile ${have ? 'have' : ''} ${locked ? 'locked' : ''}`} onClick={() => setOpen(b.id)} aria-label={`${b.name}${have ? ', en tu colección' : `, ${BADGE_PRICE} tokens`}`}>
                <BadgeArt id={b.id} size={132} locked={locked} />
                <b>{b.name}</b>
                {have ? (
                  <span className="badge-own">
                    <Icon name="check" size={13} /> En tu colección
                  </span>
                ) : (
                  <span className="badge-price">
                    <Icon name="token" size={13} /> {BADGE_PRICE} tokens
                  </span>
                )}
              </button>
            </motion.li>
          );
        })}
      </ul>
      <BadgeSheet id={open} onClose={() => setOpen(null)} showCollection={() => setTab('collection')} />
    </div>
  );
}

function BadgeSheet({ id, onClose, showCollection }: { id: string | null; onClose: () => void; showCollection: () => void }) {
  const tokens = useGame((s) => s.tokens);
  const owned = useGame((s) => s.badges);
  const buyBadge = useGame((s) => s.buyBadge);
  const showTokens = useTokensSheet((s) => s.show);
  const [step, setStep] = useState<'view' | 'confirm' | 'done'>('view');
  const [busy, setBusy] = useState(false);
  const b = id ? BADGE_BY_ID[id] : null;
  const have = b ? !!owned[b.id] : false;
  const close = () => {
    setStep('view');
    setBusy(false);
    onClose();
  };
  return (
    <Sheet open={!!b} onClose={close} className="badge-sheet">
      {b && (
        <>
          <div className="badge-hero">
            <BadgeArt id={b.id} size={210} />
          </div>
          <div className="eyebrow">America Collection · No. {String(b.no).padStart(2, '0')}</div>
          <h2 className="badge-name">{b.name}</h2>
          <p className="badge-sub">{b.subject}</p>
          <p className="badge-blurb">{b.blurb}</p>
          <div className="badge-facts">
            <span>
              <small>Precio</small>
              <b>
                <Icon name="token" size={15} /> {BADGE_PRICE} tokens
              </b>
            </span>
            <span>
              <small>Tu saldo</small>
              <b>
                <Icon name="token" size={15} /> {tokens}
              </b>
            </span>
          </div>
          <AnimatePresence mode="wait">
            {have || step === 'done' ? (
              <motion.div key="done" className="badge-done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p>
                  <Icon name="check" size={16} /> {step === 'done' ? `${b.name} ya es tuyo. Lo tienes en My Badge Collection.` : 'Ya está en tu colección.'}
                </p>
                <Btn
                  wide
                  variant="secondary"
                  onClick={() => {
                    showCollection();
                    close();
                  }}
                >
                  Ver My Badge Collection
                </Btn>
              </motion.div>
            ) : step === 'confirm' ? (
              <motion.div key="confirm" className="badge-confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p>
                  ¿Gastar <b>{BADGE_PRICE} tokens</b> en <b>{b.name}</b>? Tu saldo pasará de {tokens} a {tokens - BADGE_PRICE}.
                </p>
                <div className="row-actions">
                  <Btn variant="ghost" onClick={() => setStep('view')} disabled={busy}>
                    Cancelar
                  </Btn>
                  <Btn
                    disabled={busy}
                    onClick={() => {
                      if (busy) return;
                      setBusy(true);
                      const r = buyBadge(b.id);
                      setBusy(false);
                      setStep(r === 'ok' || r === 'owned' ? 'done' : 'view');
                    }}
                  >
                    Confirmar compra
                  </Btn>
                </div>
              </motion.div>
            ) : tokens >= BADGE_PRICE ? (
              <motion.div key="buy" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Btn wide onClick={() => setStep('confirm')}>
                  <Icon name="token" size={16} /> Comprar por {BADGE_PRICE} tokens
                </Btn>
              </motion.div>
            ) : (
              <motion.div key="funds" className="badge-funds" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Btn wide disabled>
                  Te faltan {BADGE_PRICE - tokens} {BADGE_PRICE - tokens === 1 ? 'token' : 'tokens'}
                </Btn>
                <p>
                  Ganas 1 token por cada lección o episodio sin errores.{' '}
                  <button className="link" onClick={() => showTokens(true)}>
                    Ver mis tokens
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="badge-note">Coleccionable: no aparece como logro del perfil ni da ventajas en los juegos.</p>
        </>
      )}
    </Sheet>
  );
}
