/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the SIDEYE server for the iOS app. Empty on the web (same origin). */
  readonly VITE_API_BASE?: string;
}

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
