// Install and update UI for the web app (PWA).
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { APP_VERSION, BUILD_TIME, IN_ARTIFACT, applyUpdate, promptInstall, usePwa } from '../pwa/register';
import { Btn, Icon } from './ui';

/** "Nueva versión disponible": appears when a new deploy has been downloaded in the background. */
export function UpdateBanner() {
  const ready = usePwa((s) => s.updateReady);
  const [later, setLater] = useState(false);
  if (IN_ARTIFACT) return null;
  return (
    <AnimatePresence>
      {ready && !later && (
        <motion.div className="update-banner" role="status" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}>
          <span>
            <b>Nueva versión de SIDEYE</b>
            <small>Tu progreso se mantiene.</small>
          </span>
          <button className="update-later" onClick={() => setLater(true)} aria-label="Más tarde">
            <Icon name="x" size={16} />
          </button>
          <button className="update-go" onClick={applyUpdate}>
            Actualizar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const DISMISS_KEY = 'sideye-install-hint-dismissed';
const dismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * How to put SIDEYE on the home screen, per platform.
 * - Android / Chrome: the browser's install dialog.
 * - iPhone / Safari: Share → Add to Home Screen (Apple offers no button for websites).
 * `compact`: the dismissible card on Today; otherwise the full card in Profile.
 */
export function InstallCard({ compact = false }: { compact?: boolean }) {
  const { standalone, canPrompt, platform, iosSafari } = usePwa();
  const [hidden, setHidden] = useState(dismissed);
  const [installing, setInstalling] = useState(false);
  if (IN_ARTIFACT) return null;
  if (standalone) return compact ? null : <p className="install-done">Instalada en tu pantalla de inicio · v{APP_VERSION}</p>;
  if (compact && (hidden || platform === 'other')) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode */
    }
    setHidden(true);
  };

  return (
    <section className={`install ${compact ? 'install-compact' : ''}`}>
      <div className="install-head">
        <img src="/icons/icon-192.png" alt="" width={44} height={44} />
        <span>
          <b>Instala SIDEYE</b>
          <small>{compact ? 'Como una app: pantalla completa y sin conexión.' : 'Pantalla completa, abre al instante y funciona sin conexión.'}</small>
        </span>
        {compact && (
          <button className="install-x" onClick={close} aria-label="Ocultar">
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      {canPrompt ? (
        <Btn
          wide
          disabled={installing}
          onClick={async () => {
            setInstalling(true);
            await promptInstall();
            setInstalling(false);
          }}
        >
          <Icon name="download" size={16} /> Instalar app
        </Btn>
      ) : platform === 'ios' ? (
        iosSafari && compact ? (
          <p className="install-note">
            Toca <Icon name="share" size={16} /> <b>Compartir</b> y elige <b>Añadir a pantalla de inicio</b>.
          </p>
        ) : iosSafari ? (
          <ol className="install-steps">
            <li>
              Toca <Icon name="share" size={17} /> <b>Compartir</b> en la barra de Safari.
            </li>
            <li>
              Elige <Icon name="plusbox" size={17} /> <b>Añadir a pantalla de inicio</b>.
            </li>
            <li>
              Abre SIDEYE desde el icono. <small>Tu progreso de Safari no pasa a la app: instálala antes de jugar.</small>
            </li>
          </ol>
        ) : (
          <p className="install-note">En iPhone, abre este enlace en Safari para poder añadirlo a la pantalla de inicio.</p>
        )
      ) : platform === 'android' ? (
        <p className="install-note">
          Abre el menú <b>⋮</b> de Chrome y elige <b>Instalar aplicación</b> (o <b>Añadir a pantalla de inicio</b>).
        </p>
      ) : (
        <p className="install-note">Desde el móvil: Safari en iPhone o Chrome en Android. En el ordenador, Chrome y Edge muestran un botón de instalar en la barra de direcciones.</p>
      )}
      {!compact && (
        <p className="install-version">
          Versión {APP_VERSION} · {new Date(BUILD_TIME).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </section>
  );
}
