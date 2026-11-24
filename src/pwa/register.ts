// PWA glue: service worker registration, the "new version" flow and the install prompt.
import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  /** A new version is downloaded and waiting for the user's OK. */
  updateReady: boolean;
  /** Android/desktop Chrome: the browser's own install dialog is available. */
  canPrompt: boolean;
  /** Running as an installed app (home screen), not in a browser tab. */
  standalone: boolean;
  platform: 'ios' | 'android' | 'other';
  /** Safari on iOS: the only browser there that can add a web app to the home screen. */
  iosSafari: boolean;
}

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export const usePwa = create<PwaState>(() => ({
  updateReady: false,
  canPrompt: false,
  standalone: isStandalone(),
  platform: isIOS ? 'ios' : /Android/.test(ua) ? 'android' : 'other',
  iosSafari: isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua),
}));

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let waiting: ServiceWorker | null = null;

export const APP_VERSION = __APP_VERSION__;
export const BUILD_TIME = __BUILD_TIME__;

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    usePwa.setState({ canPrompt: true });
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    usePwa.setState({ canPrompt: false, standalone: true });
  });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => usePwa.setState({ standalone: isStandalone() }));

  // Ask the browser to keep the save (localStorage) even under storage pressure.
  navigator.storage?.persist?.().catch(() => undefined);

  // Only the web build served by our own server has a service worker (not the iOS bundle,
  // not the single-file build, not the dev server).
  if (import.meta.env.MODE !== 'production' || !('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First install takes control silently; later versions only after the user taps "Actualizar".
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const track = (sw: ServiceWorker | null) => {
        if (!sw) return;
        const check = () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            waiting = sw;
            usePwa.setState({ updateReady: true });
          }
        };
        check();
        sw.addEventListener('statechange', check);
      };
      track(reg.waiting);
      reg.addEventListener('updatefound', () => track(reg.installing));
      // Look for a new version when the app comes back to the foreground, and every hour.
      const lookForUpdate = () => reg.update().catch(() => undefined);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && lookForUpdate());
      setInterval(lookForUpdate, 60 * 60 * 1000);
    } catch (e) {
      console.warn('[pwa] service worker not registered', e);
    }
  });
}

/** Switches to the downloaded version (the page reloads; progress is kept). */
export function applyUpdate() {
  if (!waiting) return location.reload();
  waiting.postMessage('SKIP_WAITING');
}

/** Opens Chrome's install dialog. Returns false if the browser does not offer one. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  usePwa.setState({ canPrompt: false });
  return outcome === 'accepted';
}
