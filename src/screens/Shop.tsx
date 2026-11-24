// THE BADGE SHOP + MY BADGE COLLECTION. Reads everything from the badge catalog
// (src/badges): new badges and collections appear here automatically.
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { BadgeArt } from '../badges/BadgeArt';
import { BADGES, BADGE_BY_ID, COLLECTIONS, STATUS_LABEL, canBuy, visibleInShop } from '../badges/catalog';
import type { CatalogBadge } from '../badges/types';
import { useGame } from '../store/game';
import { TokenPill, useTokensSheet } from '../components/Tokens';
import { Btn, Icon, Sheet } from '../components/ui';

type Tab = 'shop' | 'collection';

export function Shop() {
  const owned = useGame((s) => s.badges);
  const [tab, setTab] = useState<Tab>('shop');
  const [filter, setFilter] = useState<string>('all');
  const [open, setOpen] = useState<string | null>(null);
  const visible = BADGES.filter((b) => visibleInShop(b, owned));
  const count = visible.filter((b) => owned[b.id]).length;
  const cols = COLLECTIONS.filter((c) => filter === 'all' || c.id === filter).filter((c) => visible.some((b) => b.collection === c.id));
  return (
    <div className="screen shop">
      <div className="shop-top">
        <div className="eyebrow">
          {COLLECTIONS.length} {COLLECTIONS.length === 1 ? 'colección' : 'colecciones'} · {visible.length} escudos
        </div>
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
          ? 'Escudos de colección. Se compran con tokens y son tuyos para siempre. Son solo coleccionables: no dan puntos ni ventajas.'
          : count === 0
            ? 'Todavía no tienes escudos. Los que te faltan aparecen bloqueados: cómpralos en la tienda con tus tokens.'
            : `${count} de ${visible.length} escudos. Los que te faltan aparecen bloqueados.`}
      </p>
      <div className="sp-seg shop-seg" role="tablist">
        <button role="tab" aria-selected={tab === 'shop'} className={tab === 'shop' ? 'on' : ''} onClick={() => setTab('shop')}>
          The Badge Shop
        </button>
        <button role="tab" aria-selected={tab === 'collection'} className={tab === 'collection' ? 'on' : ''} onClick={() => setTab('collection')}>
          Collection · {count}/{visible.length}
        </button>
      </div>
      {COLLECTIONS.length > 1 && (
        <div className="shop-filters" role="group" aria-label="Colecciones">
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
            Todas
          </button>
          {COLLECTIONS.map((c) => (
            <button key={c.id} className={filter === c.id ? 'on' : ''} onClick={() => setFilter(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {cols.map((c) => {
        const list = visible.filter((b) => b.collection === c.id);
        const have = list.filter((b) => owned[b.id]).length;
        return (
          <section key={c.id} className="shop-col">
            <header className="shop-col-head">
              <div>
                <h2>{c.name}</h2>
                <p className="shop-col-tag">{c.tagline}</p>
              </div>
              <span className="shop-col-count">
                {have}/{list.length}
              </span>
            </header>
            <p className="shop-col-desc">{c.description}</p>
            {tab === 'collection' && (
              <div className="shop-progress" aria-hidden>
                <i style={{ width: `${(have / list.length) * 100}%` }} />
              </div>
            )}
            <ul className="badge-grid">
              {list.map((b, i) => (
                <BadgeTile key={b.id} b={b} i={i} have={!!owned[b.id]} locked={tab === 'collection' && !owned[b.id]} onOpen={() => setOpen(b.id)} />
              ))}
            </ul>
          </section>
        );
      })}
      <BadgeSheet id={open} onClose={() => setOpen(null)} showCollection={() => setTab('collection')} />
    </div>
  );
}

function BadgeTile({ b, i, have, locked, onOpen }: { b: CatalogBadge; i: number; have: boolean; locked: boolean; onOpen: () => void }) {
  const soon = b.status === 'coming-soon';
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
      <button
        className={`badge-tile ${have ? 'have' : ''} ${locked ? 'locked' : ''} ${soon && !have ? 'soon' : ''}`}
        onClick={onOpen}
        aria-label={`${b.name}${have ? ', en tu colección' : soon ? ', próximamente' : `, ${b.price} tokens`}`}
      >
        <BadgeArt id={b.id} size={132} locked={locked || (soon && !have)} />
        <b>{b.name}</b>
        {have ? (
          <span className="badge-own">
            <Icon name="check" size={13} /> En tu colección
          </span>
        ) : soon ? (
          <span className="badge-soon">{STATUS_LABEL['coming-soon']}</span>
        ) : (
          <span className="badge-price">
            <Icon name="token" size={13} /> {b.price} tokens
          </span>
        )}
      </button>
    </motion.li>
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
  const col = b ? COLLECTIONS.find((c) => c.id === b.collection) : null;
  const check = b ? canBuy(b, owned, tokens) : 'unknown';
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
            <BadgeArt id={b.id} size={210} locked={b.status === 'coming-soon' && !owned[b.id]} />
          </div>
          <div className="eyebrow">
            {col?.name} · No. {String(b.no).padStart(2, '0')}
          </div>
          <h2 className="badge-name">{b.name}</h2>
          <p className="badge-sub">{b.subject}</p>
          <p className="badge-blurb">{b.description}</p>
          <div className="badge-facts">
            <span>
              <small>Precio</small>
              <b>
                <Icon name="token" size={15} /> {b.price} tokens
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
            {check === 'owned' || step === 'done' ? (
              <motion.div key="done" className="badge-done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p>
                  <Icon name="check" size={16} /> {step === 'done' ? `${b.name} ya es tuyo. Lo tienes en My Badge Collection.` : b.status === 'retired' ? 'Ya no se vende, pero es tuyo para siempre.' : 'Ya está en tu colección.'}
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
            ) : check === 'coming-soon' || check === 'retired' ? (
              <motion.div key="soon" className="badge-funds" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Btn wide disabled>
                  {check === 'coming-soon' ? 'Próximamente' : 'Ya no está a la venta'}
                </Btn>
                <p>{check === 'coming-soon' ? 'Este escudo llegará pronto a la tienda. Ve guardando tokens.' : 'Este escudo se retiró de la tienda.'}</p>
              </motion.div>
            ) : step === 'confirm' ? (
              <motion.div key="confirm" className="badge-confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p>
                  ¿Gastar <b>{b.price} tokens</b> en <b>{b.name}</b>? Tu saldo pasará de {tokens} a {tokens - b.price}.
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
            ) : check === 'ok' ? (
              <motion.div key="buy" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Btn wide onClick={() => setStep('confirm')}>
                  <Icon name="token" size={16} /> Comprar por {b.price} tokens
                </Btn>
              </motion.div>
            ) : (
              <motion.div key="funds" className="badge-funds" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Btn wide disabled>
                  Te faltan {b.price - tokens} {b.price - tokens === 1 ? 'token' : 'tokens'}
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
